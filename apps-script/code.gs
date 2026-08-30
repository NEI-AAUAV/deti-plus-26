/**
 * DETI+ 2026 - enrollment backend
 *
 */

const SHEET_NAME = 'Registration';

const HEADERS = [
  'timestamp', 'token', 'name', 'email', 'mobileNumber', 'curse', 'year',
  'hasCvConsent', 'hasGdprConsent', 'cvFileId', 'cvName', 'cvUpdatedAt', 'state',
];

const MAX_CV_BYTES = 5*1024*1024
const ALLOWED_MIME = 'application/pdf'
const RATE_LIMIT_WINDOW_SECONDS = 600;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const LOCK_TIMEOUT_MS = 20000;

const YEARS = ['1', '2', '3', '4', '5','PhD', 'Other'];

// entrypoints

function doPost(e) {
  try {
    const body = parseBody_(e);
    const action = String(body.action || '');

    switch (action) {
      case 'register': return json_(handleRegister_(body));
      case 'fetch_status': return json_(handleStatus_(body));
      case 'upload':   return json_(handleUpload_(body));
      case 'resend':   return json_(handleResend_(body));
      default:         return json_(fail_('unknown_action', 'Unknown action.'));
    }
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_(fail_('server_error', 'An error occurred. Try again.'));
  }
}

//  handlers

function handleRegister_(body) {
  if (String(body.website || '').trim() !== '') {
    return ok_({ registered: true });
  }

  const data = normalizeRegistration_(body);
  const invalid = validateRegistration_(data);
  if (invalid) return fail_('invalid', invalid);

  if (isRateLimited_('reg:' + data.email)) {
    return fail_('rate_limited', 'Too many attempts. Try again in a few minutes.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);
  try {
    const sheet = getSheet_();
    const existing = findRowByEmail_(sheet, data.email);

    // Email already registered: resends the link instead of creating a duplicate.
    if (existing) {
      sendMagicLink_(existing.record, { returning: true });
      return ok_({ registered: true, alreadyRegistered: true });
    }

    const token = Utilities.getUuid();
    const record = Object.assign({}, data, {
      timestamp: new Date(),
      token: token,
      cvFileId: '',
      cvName: '',
      cvUpdatedAt: '',
      state: 'registered',
    });

    sheet.appendRow(HEADERS.map(function (h) { return record[h]; }));
    sendMagicLink_(record, { returning: false });

    return ok_({ registered: true, alreadyRegistered: false });
  } finally {
    lock.releaseLock();
  }
}

function handleStatus_(body) {
  const found = findRowByToken_(getSheet_(), body.token);
  if (!found) return fail_('invalid_token', 'Invalid or expired link.');

  const r = found.record;
  return ok_({
    name: r.name,
    email: maskEmail_(r.email),
    hasCv: Boolean(r.cvFileId),
    cvName: r.cvName || '',
    cvUpdatedAt: r.cvUpdatedAt ? new Date(r.cvUpdatedAt).toISOString() : '',
  });
}

function handleUpload_(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);
  try {
    const sheet = getSheet_();
    const found = findRowByToken_(sheet, body.token);
    if (!found) return fail_('invalid_token', 'Invalid or expired link.');

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
    const safeName = buildCvFilename_(record.name);
    const blob = Utilities.newBlob(bytes, ALLOWED_MIME, safeName);
    const folder = DriveApp.getFolderById(prop_('CV_FOLDER_ID'));

    //
    if (record.cvFileId) {
      try {
        DriveApp.getFileById(record.cvFileId).setTrashed(true);
      } catch (err) {
        console.warn('Previous CV not removed: ' + err);
      }
    }

    const file = folder.createFile(blob);
    const now = new Date();

    setCells_(sheet, found.row, {
      cvFileId: file.getId(),
      cvName: safeName,
      cvUpdatedAt: now,
      state: 'cv_delivered',
    });

    sendCvConfirmation_(record, safeName);

    return ok_({ uploaded: true, cvName: safeName, cvUpdatedAt: now.toISOString() });
  } finally {
    lock.releaseLock();
  }
}

function handleResend_(body) {
  const email = normalizeEmail_(body.email);
  if(!isValidEmail_(email)) return fail_('invalid', 'Invalid email.');

  if(isRateLimited_('resend:' + email)){
    return fail_('rate_limited', 'Too many requests. Try again in a few minutes.');
  }

  const found = findRowByEmail_(getSheet_(), email);
  if (found) sendMagicLink_ (found.record, { returning: true });

  return ok_({ sent: true });
}

// emails

function sendMagicLink_(record, opts) {
  const link = cvLink_(record.token);
  const intro = opts && opts.returning
  ? 'Here is your personal link again to submit or replace your CV.'
  : 'Your registration for DETI+ is confirmed.';

  GmailApp.sendEmail(record.email, 'DETI+ 2026 — your registration', textEmail_(intro, link), {
    name: 'DETI+',
    replyTo: prop_('EVENT_EMAIL'),
    htmlBody: htmlEmail_(record.name, intro, link),
  });
}

function sendCvConfirmation_(record, filename) {
  const intro = 'We have received your CV (' + filename + '). You can replace it at any time ' + 'using the same link.';
  const link = cvLink_(record.token);

  GmailApp.sendEmail(record.email, 'DETI+ - CV recevied',
  textEmail_(intro, link), {
    name: 'DETI+',
    replyTo: prop_('EVENT_EMAIL'),
    htmlBody: htmlEmail_(record.name, intro, link),
  });
}

function cvLink_(token) {
  return prop_('SITE_URL').replace(/\/+$/, '') + '/registration/cv/?t=' + encodeURIComponent(token);
}

function textEmail_(intro, link) {
  return [
    'Hello!',
    '',
    intro,
    '',
    link,
    '',
    'Save this email — the link is personal and works whenever you need it.',
    '',
    '— DETI+ Team',
  ].join('\n');
}

function htmlEmail_(name, intro, link) {
  const firstName = escapeHtml_(String(name || '').split(' ')[0] || '');
  return [
    '<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;',
    'line-height:1.6;color:#111;max-width:520px">',
    '<p>Hi ' + firstName + ',</p>',
    '<p>' + escapeHtml_(intro) + '</p>',
    '<p style="margin:28px 0">',
    '<a href="' + escapeHtml_(link) + '" ',
    'style="background:#111;color:#fff;padding:12px 22px;border-radius:8px;',
    'text-decoration:none;display:inline-block;font-weight:600">Send my CV</a>',
    '</p>',
    '<p style="color:#666;font-size:13px">Save this email — the link is personal and',
    'it works whenever you need to send or replace your CV.</p>',
    '<p style="color:#666;font-size:13px">— DETI+ Team</p>',
    '</div>',
  ].join('');
}


// validation

function normalizeRegistration_(body) {
  return {
    name: trim_(body.name, 120),
    email: normalizeEmail_(body.email),
    mobileNumber: trim_(body.mobileNumber, 30),
    curse: trim_(body.curse, 120),
    year: trim_(body.year, 20),
    hasCvConsent: body.hasCvConsent === true ? 'yes' : 'no',
    hasGdprConsent: body.hasGdprConsent === true ? 'yes' : 'no',
  };
}

function validateRegistration_(d) {
  if (d.name.length < 2) return 'Provide your full name.';
  if (!isValidEmail_(d.email)) return 'Enter a valid email address.';
  if (d.mobileNumber && !/^[+0-9 ()-]{6,20}$/.test(d.mobileNumber)) return 'Invalid phone number.';
  if (d.curse.length < 2) return 'Specify your course.';
  if (YEARS.indexOf(d.year) === -1) return 'Select the academic year.';
  if (d.hasGdprConsent !== 'yes') return 'You must accept the data policy.';
  return '';
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

function isPdf_(bytes) {
  const sig = [0x25, 0x50, 0x44, 0x46, 0x2d];
  if (bytes.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if ((bytes[i] & 0xff) !== sig[i]) return false;
  }
  return true;
}

// storage

function getSheet_() {
  const ss = SpreadsheetApp.openById(prop_('SHEET_ID'));
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readRecords_(sheet) {
  const values = sheet.getDataRange().getValues();
  const records = [];

  for (let i = 1; i < values.length; i++) {
    const record = {};
    HEADERS.forEach(function (h, c) { record[h] = values[i][c]; });
    records.push({ row: i + 1, record: record });
  }
  return records;
}

function findRowByToken_(sheet, token) {
  const t = String(token || '').trim();
  if (!t) return null;

  const rows = readRecords_(sheet);
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i].record.token) === t) return rows[i];
  }
  return null;
}

function findRowByEmail_(sheet, email) {
  const e = normalizeEmail_(email);
  const rows = readRecords_(sheet);

  for (let i = 0; i < rows.length; i++) {
    if (normalizeEmail_(rows[i].record.email) === e) return rows[i];
  }
  return null;
}

function setCells_(sheet, row, updates) {
  Object.keys(updates).forEach(function (key) {
    const col = HEADERS.indexOf(key) + 1;
    if (col > 0) sheet.getRange(row, col).setValue(updates[key]);
  });
}

function buildCvFilename_(name) {
  const slug = String(name || 'cv')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60) || 'cv';

  const stamp = Utilities.formatDate(new Date(), 'Europe/Lisbon', 'yyyyMMdd-HHmmss');
  return 'CV_' + slug + '_' + stamp + '.pdf';
}

// utils

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  return JSON.parse(e.postData.contents);
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok_(data) {
  return Object.assign({ ok: true }, data || {});
}

function fail_(code, message) {
  return { ok: false, error: code, message: message };
}

function prop_(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
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
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function doGet() {
  return json_({ ok: true, service: 'deti-plus-26-registration' });
}


