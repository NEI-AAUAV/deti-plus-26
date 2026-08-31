/**
 * DETI+ 2026 - enrollment backend
 */

const SHEET_NAME =
  'Registration';

const HEADERS = [
  'timestamp',
  'token',
  'name',
  'email',
  'mobileNumber',
  'curse',
  'year',
  'hasCvConsent',
  'hasGdprConsent',
  'cvFileId',
  'cvName',
  'cvUpdatedAt',
  'state',
];

const MAX_CV_BYTES =
  5 * 1024 * 1024;

const ALLOWED_MIME =
  'application/pdf';

const RATE_LIMIT_WINDOW_SECONDS =
  600;

const RATE_LIMIT_MAX_ATTEMPTS =
  5;

const LOCK_TIMEOUT_MS =
  20000;

const YEARS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  'PhD',
  'Other',
];

// -----------------------------------------------------------------------------
// Entrypoints
// -----------------------------------------------------------------------------

function doPost(e) {
  try {
    const body =
      parseBody_(e);

    const action =
      String(
        body.action ||
        ''
      );

    switch (action) {
      case 'registration_status':
        return json_(
          handleRegistrationStatus_()
        );

      case 'register':
        return json_(
          handleRegister_(
            body
          )
        );

      case 'fetch_status':
        return json_(
          handleStatus_(
            body
          )
        );

      case 'fetch_cv':
        return json_(
          handleCv_(
            body
          )
        );

      case 'upload':
        return json_(
          handleUpload_(
            body
          )
        );

      case 'resend':
        return json_(
          handleResend_(
            body
          )
        );

      default:
        return json_(
          fail_(
            'unknown_action',
            'Unknown action.'
          )
        );
    }
  } catch (err) {
    console.error(
      err &&
      err.stack
        ? err.stack
        : err
    );

    return json_(
      fail_(
        'server_error',
        'An error occurred. Try again.'
      )
    );
  }
}

function doGet() {
  return json_({
    ok: true,

    service:
      'deti-plus-26-registration',
  });
}

// -----------------------------------------------------------------------------
// Registration
// -----------------------------------------------------------------------------

function handleRegister_(
  body
) {
  if (
    String(
      body.website ||
      ''
    ).trim() !== ''
  ) {
    return ok_({
      registered: true,
    });
  }

  const data =
    normalizeRegistration_(
      body
    );

  const invalid =
    validateRegistration_(
      data
    );

  if (invalid) {
    return fail_(
      'invalid',
      invalid
    );
  }

  const hasCv =
    Boolean(
      body.cv &&
      body.cv.data
    );

  if (
    hasCv &&
    body.hasCvConsent !==
      true
  ) {
    return fail_(
      'invalid',
      'You must authorize sharing your CV when submitting it.'
    );
  }

  if (hasCv) {
    const cvAvailability =
      getCvAvailability_();

    if (
      !cvAvailability.open
    ) {
      return fail_(
        'cv_closed',
        'CV submissions are closed.'
      );
    }

    const problem =
      validateCvPayload_(
        body.cv
      );

    if (problem) {
      return fail_(
        'invalid_file',
        problem
      );
    }
  }

  if (
    isRateLimited_(
      'reg:' +
      data.email
    )
  ) {
    return fail_(
      'rate_limited',
      'Too many attempts. Try again in a few minutes.'
    );
  }

  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    LOCK_TIMEOUT_MS
  );

  try {
    const sheet =
      getSheet_();

    const existing =
      findRowByEmail_(
        sheet,
        data.email
      );

    if (existing) {
      const existingState =
        normalizedRecordState_(
          existing.record
        );

      if (
        existingState ===
        'cancelled'
      ) {
        return fail_(
          'registration_cancelled',
          'This registration has been cancelled. Contact the DETI+ team if you need help.'
        );
      }

      const registrationStatus =
        registrationStatusFromRecord_(
          existing.record
        );

      if (hasCv) {
        const previousCv =
          Boolean(
            existing.record
              .cvFileId
          );

        const uploaded =
          saveCv_(
            sheet,
            existing.row,
            existing.record,
            body.cv
          );

        existing.record.cvFileId =
          uploaded.cvFileId;

        existing.record.cvName =
          uploaded.cvName;

        existing.record.cvUpdatedAt =
          uploaded.cvUpdatedAt;

        existing.record.state =
          uploaded.state;

        logAudit_(
          previousCv
            ? 'CV_REPLACE'
            : 'CV_UPLOAD',
          existing.record,
          existingState,
          uploaded.state,
          'CV submitted during repeat registration.',
          'system'
        );
      }

      sendMagicLink_(
        existing.record,
        {
          returning: true,

          cvUploaded:
            hasCv,

          registrationStatus:
            registrationStatus,
        }
      );

      logAudit_(
        'RESEND_MAGIC_LINK',
        existing.record,
        existing.record.state,
        existing.record.state,
        'Magic link resent during repeat registration.',
        'system'
      );

      return ok_({
        registered: true,

        status:
          registrationStatus,

        alreadyRegistered:
          true,

        cvUploaded:
          hasCv,

        magicLinkSent:
          true,
      });
    }

    const availability =
      getRegistrationState_();

    const admission =
      getRegistrationAdmission_(
        availability
      );

    if (
      !admission.allowed
    ) {
      return fail_(
        admission.error,
        admission.message
      );
    }

    const token =
      Utilities.getUuid();

    const record =
      Object.assign(
        {},
        data,
        {
          timestamp:
            new Date(),

          token:
            token,

          cvFileId:
            '',

          cvName:
            '',

          cvUpdatedAt:
            '',

          state:
            admission.storedState,
        }
      );

    sheet.appendRow(
      HEADERS.map(
        function (
          header
        ) {
          return record[
            header
          ];
        }
      )
    );

    const row =
      sheet.getLastRow();

    const initialState =
      record.state;

    let cvUploaded =
      false;

    if (hasCv) {
      const uploaded =
        saveCv_(
          sheet,
          row,
          record,
          body.cv
        );

      record.cvFileId =
        uploaded.cvFileId;

      record.cvName =
        uploaded.cvName;

      record.cvUpdatedAt =
        uploaded.cvUpdatedAt;

      record.state =
        uploaded.state;

      cvUploaded =
        true;

      logAudit_(
        'CV_UPLOAD',
        record,
        initialState,
        uploaded.state,
        'CV submitted with registration.',
        'system'
      );
    }

    logAudit_(
      admission
        .registrationStatus ===
        'waitlisted'
        ? 'WAITLIST_JOIN'
        : 'REGISTER',
      record,
      '',
      record.state,
      'New public registration.',
      'system'
    );

    sendMagicLink_(
      record,
      {
        returning:
          false,

        cvUploaded:
          cvUploaded,

        registrationStatus:
          admission
            .registrationStatus,
      }
    );

    return ok_({
      registered:
        true,

      status:
        admission
          .registrationStatus,

      alreadyRegistered:
        false,

      cvUploaded:
        cvUploaded,

      magicLinkSent:
        true,
    });
  } finally {
    lock.releaseLock();
  }
}

// -----------------------------------------------------------------------------
// Participant status
// -----------------------------------------------------------------------------

function handleStatus_(
  body
) {
  const found =
    findRowByToken_(
      getSheet_(),
      body.token
    );

  if (!found) {
    return fail_(
      'invalid_token',
      'Invalid or expired link.'
    );
  }

  const record =
    found.record;

  const state =
    normalizedRecordState_(
      record
    );

  const cvAvailability =
    getCvAvailability_();

  return ok_({
    name:
      record.name,

    email:
      maskEmail_(
        record.email
      ),

    registrationStatus:
      state ===
      'cancelled'
        ? 'cancelled'
        : registrationStatusFromRecord_(
            record
          ),

    hasCv:
      Boolean(
        record.cvFileId
      ),

    cvName:
      record.cvName ||
      '',

    cvUpdatedAt:
      record.cvUpdatedAt
        ? new Date(
            record.cvUpdatedAt
          ).toISOString()
        : '',

    cvUploadsOpen:
      state !==
        'cancelled' &&
      cvAvailability.open,

    cvDeadline:
      cvAvailability.deadline,
  });
}

// -----------------------------------------------------------------------------
// CV availability
// -----------------------------------------------------------------------------

function getCvAvailability_() {
  const config =
    getEventConfig_();

  const now =
    new Date();

  let open =
    Boolean(
      config.cvUploadsEnabled
    );

  if (
    open &&
    config.cvDeadline &&
    now.getTime() >=
      config.cvDeadline
        .getTime()
  ) {
    open =
      false;
  }

  return {
    open:
      open,

    deadline:
      config.cvDeadline
        ? config.cvDeadline
            .toISOString()
        : null,
  };
}

// -----------------------------------------------------------------------------
// CV retrieval
// -----------------------------------------------------------------------------

function handleCv_(
  body
) {
  const found =
    findRowByToken_(
      getSheet_(),
      body.token
    );

  if (!found) {
    return fail_(
      'invalid_token',
      'Invalid or expired link.'
    );
  }

  if (
    !found.record
      .cvFileId
  ) {
    return fail_(
      'invalid_file',
      'There is no CV associated with this registration.'
    );
  }

  try {
    const file =
      DriveApp
        .getFileById(
          found.record
            .cvFileId
        );

    return ok_({
      filename:
        found.record
          .cvName ||
        file.getName(),

      data:
        Utilities
          .base64Encode(
            file
              .getBlob()
              .getBytes()
          ),
    });
  } catch (err) {
    console.warn(
      'CV retrieval failed: ' +
      err
    );

    return fail_(
      'server_error',
      'The CV could not be retrieved. Try again later.'
    );
  }
}

// -----------------------------------------------------------------------------
// CV upload
// -----------------------------------------------------------------------------

function handleUpload_(
  body
) {
  const lock =
    LockService
      .getScriptLock();

  lock.waitLock(
    LOCK_TIMEOUT_MS
  );

  try {
    const sheet =
      getSheet_();

    const found =
      findRowByToken_(
        sheet,
        body.token
      );

    if (!found) {
      return fail_(
        'invalid_token',
        'Invalid or expired link.'
      );
    }

    if (
      normalizedRecordState_(
        found.record
      ) ===
      'cancelled'
    ) {
      return fail_(
        'registration_cancelled',
        'This registration has been cancelled.'
      );
    }

    const cvAvailability =
      getCvAvailability_();

    if (
      !cvAvailability.open
    ) {
      return fail_(
        'cv_closed',
        'CV submissions are closed.'
      );
    }

    const mime =
      String(
        body.mime ||
        ''
      );

    if (
      mime !==
      ALLOWED_MIME
    ) {
      return fail_(
        'invalid_file',
        'The CV must be a PDF file.'
      );
    }

    let bytes;

    try {
      bytes =
        Utilities
          .base64Decode(
            String(
              body.data ||
              ''
            )
          );
    } catch (err) {
      return fail_(
        'invalid_file',
        'The file could not be read.'
      );
    }

    if (
      !bytes.length
    ) {
      return fail_(
        'invalid_file',
        'The file is empty.'
      );
    }

    if (
      bytes.length >
      MAX_CV_BYTES
    ) {
      return fail_(
        'invalid_file',
        'The CV must not exceed 5 MB.'
      );
    }

    if (
      !isPdf_(
        bytes
      )
    ) {
      return fail_(
        'invalid_file',
        'The file is not a valid PDF.'
      );
    }

    const record =
      found.record;

    const previousState =
      normalizedRecordState_(
        record
      );

    const replacing =
      Boolean(
        record.cvFileId
      );

    const uploaded =
      saveCv_(
        sheet,
        found.row,
        record,
        {
          filename:
            body.filename,

          mime:
            mime,

          bytes:
            bytes,
        }
      );

    record.cvFileId =
      uploaded.cvFileId;

    record.cvName =
      uploaded.cvName;

    record.cvUpdatedAt =
      uploaded.cvUpdatedAt;

    record.state =
      uploaded.state;

    logAudit_(
      replacing
        ? 'CV_REPLACE'
        : 'CV_UPLOAD',
      record,
      previousState,
      uploaded.state,
      replacing
        ? 'Participant replaced existing CV.'
        : 'Participant submitted CV.',
      'system'
    );

    sendCvConfirmation_(
      record,
      uploaded.cvName
    );

    return ok_({
      uploaded:
        true,

      cvName:
        uploaded.cvName,

      cvUpdatedAt:
        uploaded.cvUpdatedAt,
    });
  } finally {
    lock.releaseLock();
  }
}

function saveCv_(
  sheet,
  row,
  record,
  input
) {
  if (
    input.mime &&
    input.mime !==
      ALLOWED_MIME
  ) {
    throw new Error(
      'Invalid CV type'
    );
  }

  let bytes =
    input.bytes;

  if (!bytes) {
    bytes =
      Utilities
        .base64Decode(
          String(
            input.data ||
            ''
          )
        );

    if (
      !bytes.length ||
      bytes.length >
        MAX_CV_BYTES ||
      !isPdf_(
        bytes
      )
    ) {
      throw new Error(
        'Invalid CV'
      );
    }
  }

  const safeName =
    buildCvFilename_(
      record.name
    );

  const folder =
    DriveApp
      .getFolderById(
        prop_(
          'CV_FOLDER_ID'
        )
      );

  if (
    record.cvFileId
  ) {
    try {
      DriveApp
        .getFileById(
          record.cvFileId
        )
        .setTrashed(
          true
        );
    } catch (err) {
      console.warn(
        'Previous CV not removed: ' +
        err
      );
    }
  }

  const file =
    folder
      .createFile(
        Utilities
          .newBlob(
            bytes,
            ALLOWED_MIME,
            safeName
          )
      );

  const now =
    new Date();

  const currentState =
    normalizedRecordState_(
      record
    );

  const nextState =
    currentState ===
      'waitlisted'
      ? 'waitlisted'
      : 'cv_delivered';

  setCells_(
    sheet,
    row,
    {
      cvFileId:
        file.getId(),

      cvName:
        safeName,

      cvUpdatedAt:
        now,

      state:
        nextState,
    }
  );

  return {
    cvFileId:
      file.getId(),

    cvName:
      safeName,

    cvUpdatedAt:
      now.toISOString(),

    state:
      nextState,
  };
}

function validateCvPayload_(
  input
) {
  if (
    String(
      input.mime ||
      ''
    ) !==
    ALLOWED_MIME
  ) {
    return 'The CV must be a PDF file.';
  }

  let bytes;

  try {
    bytes =
      Utilities
        .base64Decode(
          String(
            input.data ||
            ''
          )
        );
  } catch (err) {
    return 'The file could not be read.';
  }

  if (
    !bytes.length
  ) {
    return 'The file is empty.';
  }

  if (
    bytes.length >
    MAX_CV_BYTES
  ) {
    return 'The CV must not exceed 5 MB.';
  }

  if (
    !isPdf_(
      bytes
    )
  ) {
    return 'The file is not a valid PDF.';
  }

  return '';
}

// -----------------------------------------------------------------------------
// Resend
// -----------------------------------------------------------------------------

function handleResend_(
  body
) {
  const email =
    normalizeEmail_(
      body.email
    );

  if (
    !isValidEmail_(
      email
    )
  ) {
    return fail_(
      'invalid',
      'Invalid email.'
    );
  }

  if (
    isRateLimited_(
      'resend:' +
      email
    )
  ) {
    return fail_(
      'rate_limited',
      'Too many requests. Try again in a few minutes.'
    );
  }

  const found =
    findRowByEmail_(
      getSheet_(),
      email
    );

  if (
    found &&
    normalizedRecordState_(
      found.record
    ) !==
      'cancelled'
  ) {
    sendMagicLink_(
      found.record,
      {
        returning:
          true,

        registrationStatus:
          registrationStatusFromRecord_(
            found.record
          ),
      }
    );

    logAudit_(
      'RESEND_MAGIC_LINK',
      found.record,
      found.record.state,
      found.record.state,
      'Public magic-link resend.',
      'system'
    );
  }

  /*
   * Intentionally generic to prevent email enumeration.
   */
  return ok_({
    sent:
      true,
  });
}

// -----------------------------------------------------------------------------
// Emails
// -----------------------------------------------------------------------------

function sendMagicLink_(
  record,
  opts
) {
  const options =
    opts || {};

  const link =
    cvLink_(
      record.token
    );

  const cvUploaded =
    Boolean(
      options.cvUploaded
    );

  const registrationStatus =
    options
      .registrationStatus ||
    registrationStatusFromRecord_(
      record
    );

  let subject;
  let intro;

  if (
    registrationStatus ===
    'waitlisted'
  ) {
    subject =
      'DETI+ 2026 — waiting list';

    if (
      options.returning
    ) {
      intro =
        cvUploaded
          ? 'Your CV was received. You are already on the DETI+ waiting list. Here is your personal link to view or replace your CV.'
          : 'You are already on the DETI+ waiting list. Here is your personal link to submit, view or replace your CV.';
    } else {
      intro =
        cvUploaded
          ? 'The available places for DETI+ are currently filled, so you have been added to the waiting list. Your CV was also received.'
          : 'The available places for DETI+ are currently filled, so you have been added to the waiting list. Use your personal link to submit or manage your CV.';
    }
  } else {
    subject =
      'DETI+ 2026 — your registration';

    if (
      options.returning
    ) {
      intro =
        cvUploaded
          ? 'Your CV was received and your registration is already active. Here is your personal link to view or replace it.'
          : 'Here is your personal link again to submit, view or replace your CV.';
    } else {
      intro =
        cvUploaded
          ? 'Your registration for DETI+ is confirmed and your CV was received. Use this personal link to view or replace it.'
          : 'Your registration for DETI+ is confirmed. Use this personal link to submit, view or replace your CV.';
    }
  }

  sendParticipantEmail_(
    record,
    subject,
    intro,
    link
  );
}

function sendCvConfirmation_(
  record,
  filename
) {
  const registrationStatus =
    registrationStatusFromRecord_(
      record
    );

  const intro =
    registrationStatus ===
    'waitlisted'
      ? (
          'We have received your CV (' +
          filename +
          '). You remain on the DETI+ waiting list and can replace your CV using the same personal link while CV submissions remain open.'
        )
      : (
          'We have received your CV (' +
          filename +
          '). You can replace it using the same personal link while CV submissions remain open.'
        );

  sendParticipantEmail_(
    record,
    'DETI+ — CV received',
    intro,
    cvLink_(
      record.token
    )
  );
}

function sendPromotionEmail_(
  record
) {
  const intro =
    'A place is now available and your registration for DETI+ is confirmed. Your personal CV link remains the same.';

  sendParticipantEmail_(
    record,
    'DETI+ 2026 — your place is confirmed',
    intro,
    cvLink_(
      record.token
    )
  );
}

function sendParticipantEmail_(
  record,
  subject,
  intro,
  link
) {
  GmailApp.sendEmail(
    record.email,
    subject,
    textEmail_(
      intro,
      link
    ),
    {
      name:
        'DETI+',

      replyTo:
        prop_(
          'EVENT_EMAIL'
        ),

      htmlBody:
        htmlEmail_(
          record.name,
          intro,
          link
        ),
    }
  );
}

function cvLink_(
  token
) {
  return (
    prop_(
      'SITE_URL'
    )
      .replace(
        /\/+$/,
        ''
      ) +
    '/registration/cv/?t=' +
    encodeURIComponent(
      token
    )
  );
}

function textEmail_(
  intro,
  link
) {
  return [
    'Hello!',
    '',
    intro,
    '',
    link,
    '',
    'Save this email — the link is personal.',
    '',
    '— DETI+ Team',
  ].join(
    '\n'
  );
}

function htmlEmail_(
  name,
  intro,
  link
) {
  const firstName =
    escapeHtml_(
      String(
        name ||
        ''
      )
        .split(
          ' '
        )[0] ||
      ''
    );

  return [
    '<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;',
    'line-height:1.6;color:#111;max-width:520px">',

    '<p>Hi ',
    firstName,
    ',</p>',

    '<p>',
    escapeHtml_(
      intro
    ),
    '</p>',

    '<p style="margin:28px 0">',

    '<a href="',
    escapeHtml_(
      link
    ),
    '" style="background:#111;color:#fff;padding:12px 22px;border-radius:8px;',
    'text-decoration:none;display:inline-block;font-weight:600">Manage my CV</a>',

    '</p>',

    '<p style="color:#666;font-size:13px">',
    'Save this email — the link is personal.',
    '</p>',

    '<p style="color:#666;font-size:13px">— DETI+ Team</p>',

    '</div>',
  ].join('');
}

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

function normalizeRegistration_(
  body
) {
  return {
    name:
      trim_(
        body.name,
        120
      ),

    email:
      normalizeEmail_(
        body.email
      ),

    mobileNumber:
      trim_(
        body.mobileNumber,
        30
      ),

    curse:
      trim_(
        body.curse,
        120
      ),

    year:
      trim_(
        body.year,
        20
      ),

    hasCvConsent:
      body.hasCvConsent ===
        true
        ? 'yes'
        : 'no',

    hasGdprConsent:
      body.hasGdprConsent ===
        true
        ? 'yes'
        : 'no',
  };
}

function validateRegistration_(
  data
) {
  if (
    data.name.length <
    2
  ) {
    return 'Provide your full name.';
  }

  if (
    !isValidEmail_(
      data.email
    )
  ) {
    return 'Enter a valid email address.';
  }

  if (
    data.mobileNumber &&
    !/^[+0-9 ()-]{6,20}$/
      .test(
        data.mobileNumber
      )
  ) {
    return 'Invalid phone number.';
  }

  if (
    data.curse.length <
    2
  ) {
    return 'Specify your course.';
  }

  if (
    YEARS.indexOf(
      data.year
    ) === -1
  ) {
    return 'Select the academic year.';
  }

  if (
    data.hasGdprConsent !==
    'yes'
  ) {
    return 'You must accept the data policy.';
  }

  return '';
}

function isValidEmail_(
  email
) {
  return (
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
      .test(
        email
      ) &&
    email.length <=
      254
  );
}

function isPdf_(
  bytes
) {
  const signature = [
    0x25,
    0x50,
    0x44,
    0x46,
    0x2d,
  ];

  if (
    bytes.length <
    signature.length
  ) {
    return false;
  }

  for (
    let i = 0;
    i <
    signature.length;
    i++
  ) {
    if (
      (
        bytes[i] &
        0xff
      ) !==
      signature[i]
    ) {
      return false;
    }
  }

  return true;
}

// -----------------------------------------------------------------------------
// Filename
// -----------------------------------------------------------------------------

function buildCvFilename_(
  name
) {
  const slug =
    String(
      name ||
      'cv'
    )
      .normalize(
        'NFD'
      )
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /[^a-zA-Z0-9]+/g,
        '-'
      )
      .replace(
        /^-+|-+$/g,
        ''
      )
      .toLowerCase()
      .slice(
        0,
        60
      ) ||
    'cv';

  const stamp =
    Utilities
      .formatDate(
        new Date(),
        'Europe/Lisbon',
        'yyyyMMdd-HHmmss'
      );

  return (
    'CV_' +
    slug +
    '_' +
    stamp +
    '.pdf'
  );
}

// -----------------------------------------------------------------------------
// Utils
// -----------------------------------------------------------------------------

function parseBody_(
  e
) {
  if (
    !e ||
    !e.postData ||
    !e.postData.contents
  ) {
    return {};
  }

  return JSON.parse(
    e.postData.contents
  );
}

function json_(
  payload
) {
  return ContentService
    .createTextOutput(
      JSON.stringify(
        payload
      )
    )
    .setMimeType(
      ContentService
        .MimeType
        .JSON
    );
}

function ok_(
  data
) {
  return Object.assign(
    {
      ok: true,
    },
    data ||
    {}
  );
}

function fail_(
  code,
  message
) {
  return {
    ok: false,
    error:
      code,
    message:
      message,
  };
}

function prop_(
  key
) {
  const value =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        key
      );

  if (!value) {
    throw new Error(
      'Missing Script Property: ' +
      key
    );
  }

  return value;
}

function trim_(
  value,
  max
) {
  return String(
    value == null
      ? ''
      : value
  )
    .trim()
    .slice(
      0,
      max
    );
}

function normalizeEmail_(
  value
) {
  return String(
    value == null
      ? ''
      : value
  )
    .trim()
    .toLowerCase();
}

function maskEmail_(
  email
) {
  const parts =
    String(
      email
    ).split(
      '@'
    );

  if (
    parts.length !==
    2
  ) {
    return '';
  }

  const user =
    parts[0];

  const shown =
    user.length <=
      2
      ? user
          .charAt(
            0
          )
      : user
          .slice(
            0,
            2
          );

  return (
    shown +
    '***@' +
    parts[1]
  );
}

function isRateLimited_(
  key
) {
  const cache =
    CacheService
      .getScriptCache();

  const cacheKey =
    'rl:' +
    Utilities
      .base64EncodeWebSafe(
        key
      );

  const count =
    Number(
      cache.get(
        cacheKey
      ) ||
      0
    ) + 1;

  cache.put(
    cacheKey,
    String(
      count
    ),
    RATE_LIMIT_WINDOW_SECONDS
  );

  return (
    count >
    RATE_LIMIT_MAX_ATTEMPTS
  );
}

function escapeHtml_(
  value
) {
  return String(
    value == null
      ? ''
      : value
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#39;'
    );
}
