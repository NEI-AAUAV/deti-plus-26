/**
 * DETI+ 2026 - administration
 */

const ADMIN_SHEET_NAME =
  'Admin';

const ADMIN_EMAIL_CELL =
  'B3';

const ADMIN_ACTION_CELL =
  'B16';

const ADMIN_CONFIRM_CELL =
  'B17';

const ADMIN_RESULT_CELL =
  'B19';

const ADMIN_ACTIONS = [
  'RESEND_MAGIC_LINK',
  'CANCEL_REGISTRATION',
  'RESTORE_REGISTRATION',
  'PROMOTE_WAITLIST',
];

// -----------------------------------------------------------------------------
// Initialization
// -----------------------------------------------------------------------------

function initializeOperations() {
  getSheet_();
  getSettingsSheet_();
  getAuditSheet_();

  initializeAdminSheet_();

  if (
    typeof refreshControlCenter_ ===
    'function'
  ) {
    refreshControlCenter_();
  }

  ensureAdminEditTrigger_();

  runHealthCheck();

  console.log(
    'DETI+ operations initialized.'
  );
}

function initializeAdminSheet_() {
  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(
      ADMIN_SHEET_NAME
    );

  if (!sheet) {
    sheet =
      ss.insertSheet(
        ADMIN_SHEET_NAME
      );
  }

  sheet.clear();
  sheet.setHiddenGridlines(true);

  ensureSheetSize_(
    sheet,
    40,
    6
  );

  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 360);
  sheet.setColumnWidth(3, 40);
  sheet.setColumnWidth(4, 210);
  sheet.setColumnWidth(5, 300);

  sheet
    .getRange(
      'A1:E1'
    )
    .merge()
    .setValue(
      'DETI+ — Administration'
    )
    .setBackground(
      '#111827'
    )
    .setFontColor(
      '#ffffff'
    )
    .setFontWeight(
      'bold'
    )
    .setFontSize(
      18
    );

  sheet
    .getRange(
      'A2:E2'
    )
    .merge()
    .setValue(
      'Search for a participant by email and perform controlled administrative actions.'
    )
    .setFontColor(
      '#6b7280'
    );

  sheet
    .getRange(
      'A3'
    )
    .setValue(
      'Participant email'
    )
    .setFontWeight(
      'bold'
    );

  sheet
    .getRange(
      ADMIN_EMAIL_CELL
    )
    .setBackground(
      '#f9fafb'
    );

  const labels = [
    ['Name'],
    ['Email'],
    ['Course'],
    ['Academic year'],
    ['Status'],
    ['CV'],
    ['CV updated'],
    ['Magic link token'],
  ];

  sheet
    .getRange(
      5,
      1,
      labels.length,
      1
    )
    .setValues(
      labels
    )
    .setFontWeight(
      'bold'
    )
    .setFontColor(
      '#6b7280'
    );

  /*
   * Token stays hidden.
   */
  sheet.hideRows(
    12
  );

  sheet
    .getRange(
      'A14:E14'
    )
    .merge()
    .setValue(
      'Administrative action'
    )
    .setBackground(
      '#f3f4f6'
    )
    .setFontWeight(
      'bold'
    );

  sheet
    .getRange(
      'A16'
    )
    .setValue(
      'Action'
    )
    .setFontWeight(
      'bold'
    );

  const validation =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInList(
        ADMIN_ACTIONS,
        true
      )
      .setAllowInvalid(
        false
      )
      .build();

  sheet
    .getRange(
      ADMIN_ACTION_CELL
    )
    .setDataValidation(
      validation
    );

  sheet
    .getRange(
      'A17'
    )
    .setValue(
      'Confirm'
    )
    .setFontWeight(
      'bold'
    );

  sheet
    .getRange(
      ADMIN_CONFIRM_CELL
    )
    .insertCheckboxes();

  sheet
    .getRange(
      'A19'
    )
    .setValue(
      'Result'
    )
    .setFontWeight(
      'bold'
    );

  sheet
    .getRange(
      ADMIN_RESULT_CELL
    )
    .setWrap(
      true
    );

  sheet
    .getRange(
      'D3:E3'
    )
    .merge()
    .setValue(
      'Health check'
    )
    .setBackground(
      '#f3f4f6'
    )
    .setFontWeight(
      'bold'
    );

  sheet.setFrozenRows(
    2
  );

  return sheet;
}

function ensureAdminEditTrigger_() {
  const ss =
    getSpreadsheet_();

  const exists =
    ScriptApp
      .getProjectTriggers()
      .some(
        function (
          trigger
        ) {
          return (
            trigger
              .getHandlerFunction() ===
            'handleAdminEdit_'
          );
        }
      );

  if (exists) {
    return;
  }

  ScriptApp
    .newTrigger(
      'handleAdminEdit_'
    )
    .forSpreadsheet(
      ss
    )
    .onEdit()
    .create();
}

// -----------------------------------------------------------------------------
// Edit trigger
// -----------------------------------------------------------------------------

function handleAdminEdit_(e) {
  if (
    !e ||
    !e.range
  ) {
    return;
  }

  const sheet =
    e.range.getSheet();

  if (
    sheet.getName() !==
    ADMIN_SHEET_NAME
  ) {
    return;
  }

  const a1 =
    e.range.getA1Notation();

  if (
    a1 ===
    ADMIN_EMAIL_CELL
  ) {
    loadAdminParticipant_();

    return;
  }

  if (
    a1 !==
    ADMIN_CONFIRM_CELL
  ) {
    return;
  }

  if (
    e.value !== 'TRUE'
  ) {
    return;
  }

  try {
    executeAdminAction_();
  } finally {
    sheet
      .getRange(
        ADMIN_CONFIRM_CELL
      )
      .setValue(
        false
      );
  }
}

// -----------------------------------------------------------------------------
// Participant lookup
// -----------------------------------------------------------------------------

function loadAdminParticipant_() {
  const sheet =
    getOrCreateAdminSheet_();

  clearAdminParticipant_(
    sheet
  );

  const email =
    normalizeEmail_(
      sheet
        .getRange(
          ADMIN_EMAIL_CELL
        )
        .getValue()
    );

  if (!email) {
    return null;
  }

  const found =
    findRowByEmail_(
      getSheet_(),
      email
    );

  if (!found) {
    setAdminResult_(
      'Participant not found.',
      true
    );

    return null;
  }

  const record =
    found.record;

  const state =
    String(
      record.state ||
      ''
    );

  sheet
    .getRange(
      'B5:B12'
    )
    .setValues([
      [
        record.name ||
        '',
      ],

      [
        record.email ||
        '',
      ],

      [
        record.curse ||
        '',
      ],

      [
        record.year ||
        '',
      ],

      [
        state,
      ],

      [
        record.cvFileId
          ? 'CV available'
          : 'No CV',
      ],

      [
        record.cvUpdatedAt ||
        '',
      ],

      [
        record.token ||
        '',
      ],
    ]);

  if (
    record.cvUpdatedAt
  ) {
    sheet
      .getRange(
        'B11'
      )
      .setNumberFormat(
        'dd/mm/yyyy hh:mm'
      );
  }

  if (
    record.cvFileId
  ) {
    const formula =
      '=HYPERLINK("' +
      'https://drive.google.com/file/d/' +
      String(
        record.cvFileId
      )
        .replace(
          /"/g,
          ''
        ) +
      '/view","Open CV in Google Drive")';

    sheet
      .getRange(
        'B10'
      )
      .setFormula(
        formula
      );
  }

  setAdminResult_(
    'Participant loaded.',
    false
  );

  return found;
}

function getOrCreateAdminSheet_() {
  const ss =
    getSpreadsheet_();

  return (
    ss.getSheetByName(
      ADMIN_SHEET_NAME
    ) ||
    initializeAdminSheet_()
  );
}

function clearAdminParticipant_(
  sheet
) {
  sheet
    .getRange(
      'B5:B12'
    )
    .clearContent();

  sheet
    .getRange(
      ADMIN_RESULT_CELL
    )
    .clearContent();
}

// -----------------------------------------------------------------------------
// Action dispatcher
// -----------------------------------------------------------------------------

function executeAdminAction_() {
  const adminSheet =
    getOrCreateAdminSheet_();

  const email =
    normalizeEmail_(
      adminSheet
        .getRange(
          ADMIN_EMAIL_CELL
        )
        .getValue()
    );

  const action =
    String(
      adminSheet
        .getRange(
          ADMIN_ACTION_CELL
        )
        .getValue() ||
      ''
    ).trim();

  if (
    !email
  ) {
    setAdminResult_(
      'Enter a participant email first.',
      true
    );

    return;
  }

  if (
    ADMIN_ACTIONS.indexOf(
      action
    ) === -1
  ) {
    setAdminResult_(
      'Choose a valid action.',
      true
    );

    return;
  }

  let result;

  if (
    action ===
    'RESEND_MAGIC_LINK'
  ) {
    result =
      adminResendMagicLink_(
        email
      );
  } else if (
    action ===
    'CANCEL_REGISTRATION'
  ) {
    result =
      adminCancelRegistration_(
        email
      );
  } else if (
    action ===
    'RESTORE_REGISTRATION'
  ) {
    result =
      adminRestoreRegistration_(
        email
      );
  } else if (
    action ===
    'PROMOTE_WAITLIST'
  ) {
    result =
      adminPromoteWaitlist_(
        email
      );
  }

  setAdminResult_(
    result.message,
    !result.ok
  );

  loadAdminParticipant_();

  if (
    typeof refreshControlCenter_ ===
    'function'
  ) {
    refreshControlCenter_();
  }
}

// -----------------------------------------------------------------------------
// Admin actions
// -----------------------------------------------------------------------------

function adminResendMagicLink_(
  email
) {
  const found =
    findRowByEmail_(
      getSheet_(),
      email
    );

  if (!found) {
    return {
      ok: false,
      message:
        'Participant not found.',
    };
  }

  const state =
    normalizedRecordState_(
      found.record
    );

  if (
    state ===
    'cancelled'
  ) {
    return {
      ok: false,
      message:
        'Cancelled registrations do not receive magic-link emails.',
    };
  }

  sendMagicLink_(
    found.record,
    {
      returning: true,

      registrationStatus:
        registrationStatusFromRecord_(
          found.record
        ),
    }
  );

  logAudit_(
    'RESEND_MAGIC_LINK',
    found.record,
    state,
    state,
    'Magic link resent by administrator.',
    getAdminActor_()
  );

  return {
    ok: true,
    message:
      'Magic link sent.',
  };
}

function adminCancelRegistration_(
  email
) {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    LOCK_TIMEOUT_MS
  );

  try {
    const sheet =
      getSheet_();

    const found =
      findRowByEmail_(
        sheet,
        email
      );

    if (!found) {
      return {
        ok: false,
        message:
          'Participant not found.',
      };
    }

    const previousState =
      normalizedRecordState_(
        found.record
      );

    if (
      previousState ===
      'cancelled'
    ) {
      return {
        ok: false,
        message:
          'Registration is already cancelled.',
      };
    }

    setCells_(
      sheet,
      found.row,
      {
        state:
          'cancelled',
      }
    );

    found.record.state =
      'cancelled';

    logAudit_(
      'CANCEL_REGISTRATION',
      found.record,
      previousState,
      'cancelled',
      'Registration cancelled by administrator.',
      getAdminActor_()
    );

    return {
      ok: true,
      message:
        'Registration cancelled.',
    };
  } finally {
    lock.releaseLock();
  }
}

function adminRestoreRegistration_(
  email
) {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    LOCK_TIMEOUT_MS
  );

  try {
    const sheet =
      getSheet_();

    const found =
      findRowByEmail_(
        sheet,
        email
      );

    if (!found) {
      return {
        ok: false,
        message:
          'Participant not found.',
      };
    }

    const previousState =
      normalizedRecordState_(
        found.record
      );

    if (
      previousState !==
      'cancelled'
    ) {
      return {
        ok: false,
        message:
          'Only cancelled registrations can be restored.',
      };
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
      return {
        ok: false,
        message:
          admission.message,
      };
    }

    let nextState =
      admission.storedState;

    if (
      nextState ===
        'registered' &&
      found.record.cvFileId
    ) {
      nextState =
        'cv_delivered';
    }

    setCells_(
      sheet,
      found.row,
      {
        state:
          nextState,
      }
    );

    found.record.state =
      nextState;

    sendMagicLink_(
      found.record,
      {
        returning: true,

        registrationStatus:
          registrationStatusFromRecord_(
            found.record
          ),
      }
    );

    logAudit_(
      'RESTORE_REGISTRATION',
      found.record,
      previousState,
      nextState,
      'Cancelled registration restored.',
      getAdminActor_()
    );

    return {
      ok: true,

      message:
        nextState ===
        'waitlisted'
          ? 'Registration restored to the waiting list.'
          : 'Registration restored and confirmed.',
    };
  } finally {
    lock.releaseLock();
  }
}

function adminPromoteWaitlist_(
  email
) {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    LOCK_TIMEOUT_MS
  );

  try {
    const sheet =
      getSheet_();

    const found =
      findRowByEmail_(
        sheet,
        email
      );

    if (!found) {
      return {
        ok: false,
        message:
          'Participant not found.',
      };
    }

    const previousState =
      normalizedRecordState_(
        found.record
      );

    if (
      previousState !==
      'waitlisted'
    ) {
      return {
        ok: false,
        message:
          'Participant is not on the waiting list.',
      };
    }

    const config =
      getEventConfig_();

    const counts =
      getRegistrationCounts_();

    if (
      config.maxRegistrations >
        0 &&
      counts.registered >=
        config.maxRegistrations
    ) {
      return {
        ok: false,
        message:
          'There is currently no confirmed place available.',
      };
    }

    const nextState =
      found.record.cvFileId
        ? 'cv_delivered'
        : 'registered';

    setCells_(
      sheet,
      found.row,
      {
        state:
          nextState,
      }
    );

    found.record.state =
      nextState;

    sendPromotionEmail_(
      found.record
    );

    logAudit_(
      'PROMOTE_WAITLIST',
      found.record,
      previousState,
      nextState,
      'Participant promoted from waiting list.',
      getAdminActor_()
    );

    return {
      ok: true,
      message:
        'Participant promoted and confirmation email sent.',
    };
  } finally {
    lock.releaseLock();
  }
}

// -----------------------------------------------------------------------------
// Health check
// -----------------------------------------------------------------------------

function runHealthCheck() {
  const admin =
    getOrCreateAdminSheet_();

  const results = [];

  checkProperty_(
    results,
    'SHEET_ID'
  );

  checkProperty_(
    results,
    'CV_FOLDER_ID'
  );

  checkProperty_(
    results,
    'SITE_URL'
  );

  checkProperty_(
    results,
    'EVENT_EMAIL'
  );

  try {
    const sheet =
      getSheet_();

    const currentHeaders =
      sheet
        .getRange(
          1,
          1,
          1,
          HEADERS.length
        )
        .getValues()[0];

    const valid =
      HEADERS.every(
        function (
          header,
          index
        ) {
          return (
            String(
              currentHeaders[
                index
              ]
            ) ===
            header
          );
        }
      );

    results.push([
      valid
        ? '✓'
        : '✗',
      'Registration headers',
    ]);
  } catch (err) {
    results.push([
      '✗',
      'Registration sheet',
    ]);
  }

  try {
    getSettingsSheet_();

    results.push([
      '✓',
      'Settings sheet',
    ]);
  } catch (err) {
    results.push([
      '✗',
      'Settings sheet',
    ]);
  }

  try {
    getAuditSheet_();

    results.push([
      '✓',
      'Audit Log',
    ]);
  } catch (err) {
    results.push([
      '✗',
      'Audit Log',
    ]);
  }

  try {
    DriveApp
      .getFolderById(
        prop_(
          'CV_FOLDER_ID'
        )
      )
      .getName();

    results.push([
      '✓',
      'CV folder',
    ]);
  } catch (err) {
    results.push([
      '✗',
      'CV folder',
    ]);
  }

  admin
    .getRange(
      'D4:E20'
    )
    .clearContent();

  admin
    .getRange(
      4,
      4,
      results.length,
      2
    )
    .setValues(
      results
    );

  return results;
}

function checkProperty_(
  results,
  key
) {
  const value =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        key
      );

  results.push([
    value
      ? '✓'
      : '✗',
    key,
  ]);
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function normalizedRecordState_(
  record
) {
  return String(
    record &&
    record.state
      ? record.state
      : ''
  )
    .trim()
    .toLowerCase();
}

function setAdminResult_(
  message,
  error
) {
  const cell =
    getOrCreateAdminSheet_()
      .getRange(
        ADMIN_RESULT_CELL
      );

  cell
    .setValue(
      message
    )
    .setFontColor(
      error
        ? '#b91c1c'
        : '#047857'
    );
}
