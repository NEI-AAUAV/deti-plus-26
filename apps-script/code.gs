/**
 * DETI+ 2026 - enrollment backend
 */

const SHEET_NAME = 'Registration';

/**
 * Canonical schema.
 *
 * Legacy fields are intentionally kept at the end during the transition:
 * - timestamp
 * - curse
 * - state
 */
const HEADERS = [
  'registrationId',
  'registeredAt',
  'token',
  'name',
  'email',
  'mobileNumber',
  'course',
  'year',
  'registrationStatus',
  'cvStatus',
  'hasCvConsent',
  'hasGdprConsent',
  'cvFileId',
  'cvName',
  'cvSubmittedAt',
  'cvUpdatedAt',
  'checkedIn',
  'checkedInAt',
  'cancelledAt',
  'notes',
  'timestamp',
  'curse',
  'state',
];

const MAX_CV_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = 'application/pdf';
const RATE_LIMIT_WINDOW_SECONDS = 600;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const LOCK_TIMEOUT_MS = 20000;
const YEARS = ['1', '2', '3', '4', '5', 'PhD', 'Other'];

// -----------------------------------------------------------------------------
// Entrypoints
// -----------------------------------------------------------------------------

function doPost(e) {
  try {
    const body = parseBody_(e);
    const action = String(body.action || '');

    switch (action) {
      case 'registration_status':
        return json_(handleRegistrationStatus_());
      case 'register':
        return json_(handleRegister_(body));
      case 'fetch_status':
        return json_(handleStatus_(body));
      case 'fetch_cv':
        return json_(handleCv_(body));
      case 'upload':
        return json_(handleUpload_(body));
      case 'resend':
        return json_(handleResend_(body));
      default:
        return json_(fail_('unknown_action', 'Unknown action.'));
    }
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_(fail_('server_error', 'An error occurred. Try again.'));
  }
}

function doGet() {
  return json_({ ok: true, service: 'deti-plus-26-registration' });
}

// -----------------------------------------------------------------------------
// Registration
// -----------------------------------------------------------------------------

function handleRegister_(body) {
  const perfStartedAt = Date.now();
  const perf = function (name, startedAt) {
    console.log('[perf] register ' + name + '=' + (Date.now() - startedAt) + 'ms');
  };
  let perfMark = perfStartedAt;

  // Honeypot: behave as if the bot submission succeeded.
  if (String(body.website || '').trim() !== '') {
    return ok_({ registered: true });
  }

  const data = normalizeRegistration_(body);
  const invalid = validateRegistration_(data);
  perf('validation', perfMark);
  perfMark = Date.now();

  if (invalid) return fail_('invalid', invalid);

  const hasCv = Boolean(body.cv && body.cv.data);

  if (hasCv && body.hasCvConsent !== true) {
    return fail_(
      'invalid',
      'You must authorize sharing your CV when submitting it.'
    );
  }

  if (hasCv) {
    const cvAvailability = getCvAvailability_();
    if (!cvAvailability.open) {
      return fail_('cv_closed', 'CV submissions are closed.');
    }

    const problem = validateCvPayload_(body.cv);
    if (problem) return fail_('invalid_file', problem);
  }

  if (isRateLimited_('reg:' + data.email)) {
    return fail_('rate_limited', 'Too many attempts. Try again in a few minutes.');
  }
  perf('rateLimit', perfMark);
  perfMark = Date.now();

  // Capacity decisions must happen under the script lock.
  const lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);
  perf('lockWait', perfMark);
  perfMark = Date.now();

  let createdRecord = null;
  let createdStatus = null;
  let createdRow = null;
  let cvUploaded = false;

  try {
    const sheet = getSheet_();
    perf('getSheet', perfMark);
    perfMark = Date.now();

    const existing = findRowByEmail_(sheet, data.email);
    perf('findEmail', perfMark);
    perfMark = Date.now();

    if (existing) {
      return handleExistingRegistration_(sheet, existing, body, hasCv);
    }

    const config = getEventConfig_();
    perf('config', perfMark);
    perfMark = Date.now();

    const counters = getRegistrationCounters_({ lockHeld: true });
    perf('counters', perfMark);
    perfMark = Date.now();

    const availability = getRegistrationState_(config, counters);
    const admission = getRegistrationAdmission_(availability);

    if (!admission.allowed) {
      return fail_(admission.error, admission.message);
    }

    const now = new Date();
    const registrationId = createNextRegistrationId_(sheet);
    perf('createId', perfMark);
    perfMark = Date.now();

    const registrationStatus = admission.registrationStatus;
    const legacyState = legacyStateFor_(registrationStatus, 'none');

    const record = {
      registrationId: registrationId,
      registeredAt: now,
      token: Utilities.getUuid(),
      name: data.name,
      email: data.email,
      mobileNumber: data.mobileNumber,
      course: data.course,
      year: data.year,
      registrationStatus: registrationStatus,
      cvStatus: 'none',
      hasCvConsent: data.hasCvConsent,
      hasGdprConsent: data.hasGdprConsent,
      cvFileId: '',
      cvName: '',
      cvSubmittedAt: '',
      cvUpdatedAt: '',
      checkedIn: false,
      checkedInAt: '',
      cancelledAt: '',
      notes: '',
      timestamp: now,
      curse: data.course,
      state: legacyState,
    };

    const row = appendRegistration_(sheet, record, sheet.getLastRow() + 1);
    perf('append', perfMark);
    perfMark = Date.now();

    updateRegistrationCountersForTransition_(
      '',
      registrationStatus,
      false,
      false,
      { lockHeld: true }
    );
    invalidateRegistrationStatusCache_();
    perf('counterUpdate', perfMark);
    perfMark = Date.now();

    createdRecord = record;
    createdStatus = registrationStatus;
    createdRow = row;
  } finally {
    lock.releaseLock();
  }

  // Audit, Drive and email work happens after the capacity lock is released.
  try {
    if (hasCv) {
      const uploaded = saveCv_(
        getSheet_(),
        createdRow,
        createdRecord,
        body.cv
      );

      applyCvResultToRecord_(createdRecord, uploaded);
      cvUploaded = true;

      logAudit_(
        'CV_UPLOADED',
        createdRecord,
        'none',
        uploaded.cvStatus,
        'CV submitted with registration.',
        'PUBLIC'
      );
    }

    logAudit_(
      createdStatus === 'waitlisted'
        ? 'REGISTRATION_WAITLISTED'
        : 'REGISTRATION_CREATED',
      createdRecord,
      '',
      createdStatus,
      'New public registration.',
      'PUBLIC'
    );
    perf('audit', perfMark);
    perfMark = Date.now();

    // sendMagicLink_ is implemented in emails.gs and deliberately never throws
    // a queue failure back into an already completed registration.
    sendMagicLink_(createdRecord, {
      returning: false,
      cvUploaded: cvUploaded,
      registrationStatus: createdStatus,
    });
    perf('queueEmail', perfMark);
    perfMark = Date.now();

    return ok_({
      registered: true,
      status: createdStatus,
      alreadyRegistered: false,
      cvUploaded: cvUploaded,
      magicLinkSent: true,
    });
  } finally {
    perf('cv', perfMark);
    perf('total', perfStartedAt);
  }
}

function handleExistingRegistration_(sheet, existing, body, hasCv) {
  const record = existing.record;
  const registrationStatus = normalizedRegistrationStatus_(record);

  if (registrationStatus === 'cancelled') {
    return fail_(
      'registration_cancelled',
      'This registration has been cancelled. Contact the DETI+ team if you need help.'
    );
  }

  let cvUploaded = false;

  if (hasCv) {
    const previousCvStatus = normalizedCvStatus_(record);
    const uploaded = saveCv_(sheet, existing.row, record, body.cv);
    applyCvResultToRecord_(record, uploaded);
    cvUploaded = true;

    logAudit_(
      previousCvStatus === 'none' ? 'CV_UPLOADED' : 'CV_REPLACED',
      record,
      previousCvStatus,
      uploaded.cvStatus,
      'CV submitted during repeat registration.',
      'PUBLIC'
    );
  }

  sendMagicLink_(record, {
    returning: true,
    cvUploaded: cvUploaded,
    registrationStatus: registrationStatus,
  });

  logAudit_(
    'MAGIC_LINK_RESENT',
    record,
    registrationStatus,
    registrationStatus,
    'Magic link resent during repeat registration.',
    'PUBLIC'
  );

  return ok_({
    registered: true,
    status: registrationStatus,
    alreadyRegistered: true,
    cvUploaded: cvUploaded,
    magicLinkSent: true,
  });
}

// -----------------------------------------------------------------------------
// Participant status
// -----------------------------------------------------------------------------

function handleStatus_(body) {
  const found = findRowByToken_(getSheet_(), body.token);
  if (!found) return fail_('invalid_token', 'Invalid or expired link.');

  const record = found.record;
  const registrationStatus = normalizedRegistrationStatus_(record);
  const cvStatus = normalizedCvStatus_(record);
  const cvAvailability = getCvAvailability_();

  return ok_({
    registrationId: record.registrationId || '',
    name: record.name,
    email: maskEmail_(record.email),
    registrationStatus: registrationStatus,
    checkedIn: isRecordCheckedIn_(record),
    checkedInAt: toIsoStringOrEmpty_(record.checkedInAt),
    cvStatus: cvStatus,
    hasCv: Boolean(record.cvFileId),
    cvName: record.cvName || '',
    cvSubmittedAt: toIsoStringOrEmpty_(record.cvSubmittedAt),
    cvUpdatedAt: toIsoStringOrEmpty_(record.cvUpdatedAt),
    cvUploadsOpen: registrationStatus !== 'cancelled' && cvAvailability.open,
    cvDeadline: cvAvailability.deadline,
  });
}

// -----------------------------------------------------------------------------
// CV availability / retrieval / upload
// -----------------------------------------------------------------------------

function getCvAvailability_() {
  const config = getEventConfig_();
  const now = new Date();
  let open = Boolean(config.cvUploadsEnabled);

  if (open && config.cvDeadline && now.getTime() >= config.cvDeadline.getTime()) {
    open = false;
  }

  return {
    open: open,
    deadline: config.cvDeadline ? config.cvDeadline.toISOString() : null,
  };
}

function handleCv_(body) {
  const found = findRowByToken_(getSheet_(), body.token);
  if (!found) return fail_('invalid_token', 'Invalid or expired link.');

  if (!found.record.cvFileId) {
    return fail_('invalid_file', 'There is no CV associated with this registration.');
  }

  try {
    const file = DriveApp.getFileById(found.record.cvFileId);
    return ok_({
      filename: found.record.cvName || file.getName(),
      data: Utilities.base64Encode(file.getBlob().getBytes()),
    });
  } catch (err) {
    console.warn('CV retrieval failed: ' + err);
    return fail_(
      'server_error',
      'The CV could not be retrieved. Try again later.'
    );
  }
}

function handleUpload_(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);

  try {
    const sheet = getSheet_();
    const found = findRowByToken_(sheet, body.token);

    if (!found) return fail_('invalid_token', 'Invalid or expired link.');

    const registrationStatus = normalizedRegistrationStatus_(found.record);
    if (registrationStatus === 'cancelled') {
      return fail_('registration_cancelled', 'This registration has been cancelled.');
    }

    const cvAvailability = getCvAvailability_();
    if (!cvAvailability.open) {
      return fail_('cv_closed', 'CV submissions are closed.');
    }

    const mime = String(body.mime || '');
    if (mime !== ALLOWED_MIME) {
      return fail_('invalid_file', 'The CV must be a PDF file.');
    }

    let bytes;
    try {
      bytes = Utilities.base64Decode(String(body.data || ''));
    } catch (err) {
      return fail_('invalid_file', 'The file could not be read.');
    }

    if (!bytes.length) return fail_('invalid_file', 'The file is empty.');
    if (bytes.length > MAX_CV_BYTES) {
      return fail_('invalid_file', 'The CV must not exceed 5 MB.');
    }
    if (!isPdf_(bytes)) {
      return fail_('invalid_file', 'The file is not a valid PDF.');
    }

    const record = found.record;
    const previousCvStatus = normalizedCvStatus_(record);
    const uploaded = saveCv_(sheet, found.row, record, {
      filename: body.filename,
      mime: mime,
      bytes: bytes,
    });

    applyCvResultToRecord_(record, uploaded);

    logAudit_(
      previousCvStatus === 'none' ? 'CV_UPLOADED' : 'CV_REPLACED',
      record,
      previousCvStatus,
      uploaded.cvStatus,
      previousCvStatus === 'none'
        ? 'Participant submitted CV.'
        : 'Participant replaced existing CV.',
      'PUBLIC'
    );

    sendCvConfirmation_(
      record,
      uploaded.cvName,
      previousCvStatus !== 'none'
    );

    return ok_({
      uploaded: true,
      cvStatus: uploaded.cvStatus,
      cvName: uploaded.cvName,
      cvSubmittedAt: uploaded.cvSubmittedAt,
      cvUpdatedAt: uploaded.cvUpdatedAt,
    });
  } finally {
    lock.releaseLock();
  }
}

function saveCv_(sheet, row, record, input) {
  if (input.mime && input.mime !== ALLOWED_MIME) {
    throw new Error('Invalid CV type');
  }

  let bytes = input.bytes;
  if (!bytes) {
    bytes = Utilities.base64Decode(String(input.data || ''));

    if (!bytes.length || bytes.length > MAX_CV_BYTES || !isPdf_(bytes)) {
      throw new Error('Invalid CV');
    }
  }

  const replacing = Boolean(record.cvFileId);
  const safeName = buildCvFilename_(record.name);
  const folder = DriveApp.getFolderById(prop_('CV_FOLDER_ID'));

  // Create first, persist the sheet second, trash the old file only last.
  const newFile = folder.createFile(
    Utilities.newBlob(bytes, ALLOWED_MIME, safeName)
  );

  const previousFileId = String(record.cvFileId || '');
  const now = new Date();
  const currentSubmittedAt = record.cvSubmittedAt ? record.cvSubmittedAt : now;
  const cvStatus = replacing ? 'updated' : 'submitted';
  const registrationStatus = normalizedRegistrationStatus_(record);
  const legacyState = legacyStateFor_(registrationStatus, cvStatus);

  try {
    setCells_(sheet, row, {
      cvFileId: newFile.getId(),
      cvName: safeName,
      cvStatus: cvStatus,
      cvSubmittedAt: currentSubmittedAt,
      cvUpdatedAt: now,
      state: legacyState,
    });
  } catch (err) {
    try {
      newFile.setTrashed(true);
    } catch (cleanupErr) {
      console.warn('Failed to clean new CV after sheet error: ' + cleanupErr);
    }
    throw err;
  }

  if (replacing && previousFileId) {
    try {
      DriveApp.getFileById(previousFileId).setTrashed(true);
    } catch (err) {
      console.warn('Previous CV not removed: ' + err);
    }
  }

  return {
    cvFileId: newFile.getId(),
    cvName: safeName,
    cvStatus: cvStatus,
    cvSubmittedAt: toIsoStringOrEmpty_(currentSubmittedAt),
    cvUpdatedAt: now.toISOString(),
    legacyState: legacyState,
  };
}

function applyCvResultToRecord_(record, uploaded) {
  record.cvFileId = uploaded.cvFileId;
  record.cvName = uploaded.cvName;
  record.cvStatus = uploaded.cvStatus;
  record.cvSubmittedAt = uploaded.cvSubmittedAt;
  record.cvUpdatedAt = uploaded.cvUpdatedAt;
  record.state = uploaded.legacyState;
}

function validateCvPayload_(input) {
  if (String(input.mime || '') !== ALLOWED_MIME) {
    return 'The CV must be a PDF file.';
  }

  let bytes;
  try {
    bytes = Utilities.base64Decode(String(input.data || ''));
  } catch (err) {
    return 'The file could not be read.';
  }

  if (!bytes.length) return 'The file is empty.';
  if (bytes.length > MAX_CV_BYTES) return 'The CV must not exceed 5 MB.';
  if (!isPdf_(bytes)) return 'The file is not a valid PDF.';
  return '';
}

// -----------------------------------------------------------------------------
// Resend
// -----------------------------------------------------------------------------

function handleResend_(body) {
  const email = normalizeEmail_(body.email);

  if (!isValidEmail_(email)) return fail_('invalid', 'Invalid email.');
  if (isRateLimited_('resend:' + email)) {
    return fail_('rate_limited', 'Too many requests. Try again in a few minutes.');
  }

  const found = findRowByEmail_(getSheet_(), email);

  if (found && normalizedRegistrationStatus_(found.record) !== 'cancelled') {
    const registrationStatus = normalizedRegistrationStatus_(found.record);

    sendMagicLink_(found.record, {
      returning: true,
      registrationStatus: registrationStatus,
    });

    logAudit_(
      'MAGIC_LINK_RESENT',
      found.record,
      registrationStatus,
      registrationStatus,
      'Public magic-link resend.',
      'PUBLIC'
    );
  }

  // Intentionally generic to prevent email enumeration.
  return ok_({ sent: true });
}

// -----------------------------------------------------------------------------
// Participant link
// -----------------------------------------------------------------------------

function cvLink_(token) {
  return (
    prop_('SITE_URL').replace(/\/+$/, '') +
    '/registration/cv/?t=' +
    encodeURIComponent(token)
  );
}

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

function normalizeRegistration_(body) {
  const course = trim_(body.course != null ? body.course : body.curse, 120);

  return {
    name: trim_(body.name, 120),
    email: normalizeEmail_(body.email),
    mobileNumber: trim_(body.mobileNumber, 30),
    course: course,
    year: trim_(body.year, 20),
    hasCvConsent: body.hasCvConsent === true ? 'yes' : 'no',
    hasGdprConsent: body.hasGdprConsent === true ? 'yes' : 'no',
  };
}

function validateRegistration_(data) {
  if (data.name.length < 2) return 'Provide your full name.';
  if (!isValidEmail_(data.email)) return 'Enter a valid email address.';

  if (data.mobileNumber && !/^[+0-9 ()-]{6,20}$/.test(data.mobileNumber)) {
    return 'Invalid phone number.';
  }

  if (data.course.length < 2) return 'Specify your course.';
  if (YEARS.indexOf(data.year) === -1) return 'Select the academic year.';
  if (data.hasGdprConsent !== 'yes') return 'You must accept the data policy.';
  return '';
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

function isPdf_(bytes) {
  const signature = [0x25, 0x50, 0x44, 0x46, 0x2d];
  if (bytes.length < signature.length) return false;

  for (let i = 0; i < signature.length; i++) {
    if ((bytes[i] & 0xff) !== signature[i]) return false;
  }

  return true;
}

// -----------------------------------------------------------------------------
// Registration / CV state compatibility
// -----------------------------------------------------------------------------

function normalizedRegistrationStatus_(record) {
  const current = String(
    record && record.registrationStatus ? record.registrationStatus : ''
  )
    .trim()
    .toLowerCase();

  if (
    current === 'confirmed' ||
    current === 'waitlisted' ||
    current === 'cancelled'
  ) {
    return current;
  }

  const legacy = String(record && record.state ? record.state : '')
    .trim()
    .toLowerCase();

  if (legacy === 'waitlisted') return 'waitlisted';
  if (legacy === 'cancelled') return 'cancelled';
  if (legacy === 'checked_in') return 'confirmed';
  return 'confirmed';
}

function normalizedCvStatus_(record) {
  const current = String(record && record.cvStatus ? record.cvStatus : '')
    .trim()
    .toLowerCase();

  if (current === 'none' || current === 'submitted' || current === 'updated') {
    return current;
  }

  if (record && record.cvFileId) return 'submitted';

  const legacyState = String(record && record.state ? record.state : '')
    .trim()
    .toLowerCase();

  if (legacyState === 'cv_delivered') return 'submitted';
  return 'none';
}

function legacyStateFor_(registrationStatus, cvStatus) {
  if (registrationStatus === 'cancelled') return 'cancelled';
  if (registrationStatus === 'waitlisted') return 'waitlisted';
  if (cvStatus === 'submitted' || cvStatus === 'updated') return 'cv_delivered';
  return 'registered';
}

function isRecordCheckedIn_(record) {
  return Boolean(
    record &&
      (record.checkedIn === true ||
        String(record.checkedIn || '').toLowerCase() === 'true' ||
        record.registrationStatus === 'checked_in' ||
        record.state === 'checked_in')
  );
}

function normalizedRecordState_(record) {
  return legacyStateFor_(
    normalizedRegistrationStatus_(record),
    normalizedCvStatus_(record)
  );
}

// -----------------------------------------------------------------------------
// Filename
// -----------------------------------------------------------------------------

function buildCvFilename_(name) {
  const slug =
    String(name || 'cv')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 60) || 'cv';

  const stamp = Utilities.formatDate(
    new Date(),
    DEFAULT_EVENT_TIMEZONE,
    'yyyyMMdd-HHmmss'
  );

  return 'CV_' + slug + '_' + stamp + '.pdf';
}

// -----------------------------------------------------------------------------
// Utils
// -----------------------------------------------------------------------------

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  return JSON.parse(e.postData.contents);
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function ok_(data) {
  return Object.assign({ ok: true }, data || {});
}

function fail_(code, message) {
  return { ok: false, error: code, message: message };
}

function prop_(key) {
  if (typeof scriptPropertiesCache_ === 'undefined') scriptPropertiesCache_ = {};

  const value = Object.prototype.hasOwnProperty.call(scriptPropertiesCache_, key)
    ? scriptPropertiesCache_[key]
    : (scriptPropertiesCache_[key] =
        PropertiesService.getScriptProperties().getProperty(key));

  if (!value) throw new Error('Missing Script Property: ' + key);
  return value;
}

function trim_(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function normalizeEmail_(value) {
  return String(value == null ? '' : value).trim().toLowerCase();
}

function maskEmail_(email) {
  const parts = String(email).split('@');
  if (parts.length !== 2) return '';

  const user = parts[0];
  const shown = user.length <= 2 ? user.charAt(0) : user.slice(0, 2);
  return shown + '***@' + parts[1];
}

function isRateLimited_(key) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'rl:' + Utilities.base64EncodeWebSafe(key);
  const count = Number(cache.get(cacheKey) || 0) + 1;

  cache.put(cacheKey, String(count), RATE_LIMIT_WINDOW_SECONDS);
  return count > RATE_LIMIT_MAX_ATTEMPTS;
}

function escapeHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toIsoStringOrEmpty_(value) {
  if (value === '' || value === null || typeof value === 'undefined') return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}
