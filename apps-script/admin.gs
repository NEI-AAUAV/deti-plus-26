/**
 * DETI+ 2026 - administration
 */

const ADMIN_SHEET_NAME =
  'Admin';

const ADMIN_EMAIL_CELL =
  'B3';

const ADMIN_ACTION_CELL =
  'B18';

const ADMIN_CONFIRM_CELL =
  'B19';

const ADMIN_RESULT_CELL =
  'B21';

const ADMIN_ACTIONS = [
  'RESEND_MAGIC_LINK',
  'CANCEL_REGISTRATION',
  'RESTORE_REGISTRATION',
  'PROMOTE_WAITLIST',
  'CHECK_IN',
  'UNDO_CHECK_IN',
  'DELETE_PARTICIPANT_DATA',
];

// -----------------------------------------------------------------------------
// Initialization
// -----------------------------------------------------------------------------

function initializeOperations() {
  /*
   * Migrate before exposing the operational sheets.
   */
  if (
    typeof migrateSystem ===
    'function'
  ) {
    migrateSystem();
  }

  const registrationSheet =
    getSheet_();

  getSettingsSheet_();
  getAuditSheet_();

  initializeAdminSheet_();

  formatRegistrationSheet_(
    registrationSheet
  );

  if (
    typeof refreshControlCenter_ ===
    'function'
  ) {
    refreshControlCenter_();
  }

  ensureAdminEditTrigger_();
  ensureRegistrationEditTrigger_();

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
  sheet.setHiddenGridlines(
    true
  );

  ensureSheetSize_(
    sheet,
    45,
    6
  );

  sheet.setColumnWidth(
    1,
    220
  );

  sheet.setColumnWidth(
    2,
    360
  );

  sheet.setColumnWidth(
    3,
    40
  );

  sheet.setColumnWidth(
    4,
    210
  );

  sheet.setColumnWidth(
    5,
    300
  );

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
    ['Registration ID'],
    ['Name'],
    ['Email'],
    ['Course'],
    ['Academic year'],
    ['Registration status'],
    ['CV status'],
    ['CV'],
    ['CV updated'],
    ['Checked in'],
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

  sheet
    .getRange(
      'A16:E16'
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
      'A18'
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
      'A19'
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
      'A21'
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

// -----------------------------------------------------------------------------
// Triggers
// -----------------------------------------------------------------------------

function ensureAdminEditTrigger_() {
  ensureSpreadsheetTrigger_(
    'handleAdminEdit_'
  );
}

function ensureRegistrationEditTrigger_() {
  ensureSpreadsheetTrigger_(
    'handleRegistrationEdit_'
  );
}

function ensureSpreadsheetTrigger_(
  handler
) {
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
            handler
          );
        }
      );

  if (exists) {
    return;
  }

  ScriptApp
    .newTrigger(
      handler
    )
    .forSpreadsheet(
      ss
    )
    .onEdit()
    .create();
}

// -----------------------------------------------------------------------------
// Admin sheet edit
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
    e.range
      .getA1Notation();

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
    e.value !==
    'TRUE'
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
// Registration sheet edit
// -----------------------------------------------------------------------------

function handleRegistrationEdit_(e) {
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
    SHEET_NAME
  ) {
    return;
  }

  const map =
    getHeaderMap_(
      sheet
    );

  const checkedInColumn =
    map.checkedIn;

  const notesColumn =
    map.notes;

  /*
   * Notes are intentionally editable without additional business logic.
   */
  if (
    notesColumn &&
    e.range.getColumn() ===
      notesColumn
  ) {
    return;
  }

  if (
    !checkedInColumn ||
    e.range.getColumn() !==
      checkedInColumn ||
    e.range.getRow() <
      2
  ) {
    return;
  }

  const rows =
    readRecords_(
      sheet
    );

  const entry =
    rows.find(
      function (
        item
      ) {
        return (
          item.row ===
          e.range.getRow()
        );
      }
    );

  if (!entry) {
    return;
  }

  const record =
    entry.record;

  const previousStatus =
    normalizedRegistrationStatus_(
      record
    );

  if (
    previousStatus ===
    'cancelled'
  ) {
    e.range.setValue(
      false
    );

    return;
  }

  const checked =
    e.value ===
    'TRUE';

  if (checked) {
    const now =
      new Date();

    setCells_(
      sheet,
      entry.row,
      {
        checkedIn:
          true,

        checkedInAt:
          now,

        registrationStatus:
          'checked_in',

        state:
          'checked_in',
      }
    );

    record.checkedIn =
      true;

    record.checkedInAt =
      now;

    record.registrationStatus =
      'checked_in';

    record.state =
      'checked_in';

    logAudit_(
      'PARTICIPANT_CHECKED_IN',
      record,
      previousStatus,
      'checked_in',
      'Check-in checkbox enabled.',
      getAdminActor_()
    );
  } else {
    const nextStatus =
      'confirmed';

    setCells_(
      sheet,
      entry.row,
      {
        checkedIn:
          false,

        checkedInAt:
          '',

        registrationStatus:
          nextStatus,

        state:
          legacyStateFor_(
            nextStatus,
            normalizedCvStatus_(
              record
            )
          ),
      }
    );

    record.checkedIn =
      false;

    record.checkedInAt =
      '';

    record.registrationStatus =
      nextStatus;

    logAudit_(
      'PARTICIPANT_CHECKIN_REVERSED',
      record,
      previousStatus,
      nextStatus,
      'Check-in checkbox disabled.',
      getAdminActor_()
    );
  }

  if (
    typeof refreshControlCenter_ ===
    'function'
  ) {
    refreshControlCenter_();
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

  const registrationStatus =
    normalizedRegistrationStatus_(
      record
    );

  const cvStatus =
    normalizedCvStatus_(
      record
    );

  sheet
    .getRange(
      'B5:B14'
    )
    .setValues([
      [
        record.registrationId ||
        '',
      ],
      [
        record.name ||
        '',
      ],
      [
        record.email ||
        '',
      ],
      [
        record.course ||
        record.curse ||
        '',
      ],
      [
        record.year ||
        '',
      ],
      [
        registrationStatus,
      ],
      [
        cvStatus,
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
        Boolean(
          record.checkedIn
        ),
      ],
    ]);

  if (
    record.cvUpdatedAt
  ) {
    sheet
      .getRange(
        'B13'
      )
      .setNumberFormat(
        'dd/mm/yyyy hh:mm'
      );
  }

  if (
    record.cvFileId
  ) {
    const fileId =
      String(
        record.cvFileId
      ).replace(
        /"/g,
        ''
      );

    const formula =
      '=HYPERLINK("' +
      'https://drive.google.com/file/d/' +
      fileId +
      '/view","Open CV in Google Drive")';

    sheet
      .getRange(
        'B12'
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
      'B5:B14'
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

  if (!email) {
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

  switch (action) {
    case 'RESEND_MAGIC_LINK':
      result =
        adminResendMagicLink_(
          email
        );
      break;

    case 'CANCEL_REGISTRATION':
      result =
        adminCancelRegistration_(
          email
        );
      break;

    case 'RESTORE_REGISTRATION':
      result =
        adminRestoreRegistration_(
          email
        );
      break;

    case 'PROMOTE_WAITLIST':
      result =
        adminPromoteWaitlist_(
          email
        );
      break;

    case 'CHECK_IN':
      result =
        adminCheckIn_(
          email
        );
      break;

    case 'UNDO_CHECK_IN':
      result =
        adminUndoCheckIn_(
          email
        );
      break;

    case 'DELETE_PARTICIPANT_DATA':
      result =
        adminDeleteParticipantData_(
          email
        );
      break;

    default:
      result = {
        ok:
          false,

        message:
          'Unsupported action.',
      };
  }

  setAdminResult_(
    result.message,
    !result.ok
  );

  if (
    action !==
    'DELETE_PARTICIPANT_DATA' ||
    !result.ok
  ) {
    loadAdminParticipant_();
  } else {
    clearAdminParticipant_(
      adminSheet
    );

    adminSheet
      .getRange(
        ADMIN_EMAIL_CELL
      )
      .clearContent();

    setAdminResult_(
      result.message,
      false
    );
  }

  if (
    typeof refreshControlCenter_ ===
    'function'
  ) {
    refreshControlCenter_();
  }
}

// -----------------------------------------------------------------------------
// Resend
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
    return adminError_(
      'Participant not found.'
    );
  }

  const status =
    normalizedRegistrationStatus_(
      found.record
    );

  if (
    status ===
    'cancelled'
  ) {
    return adminError_(
      'Cancelled registrations do not receive magic-link emails.'
    );
  }

  sendMagicLink_(
    found.record,
    {
      returning:
        true,

      registrationStatus:
        status,
    }
  );

  logAudit_(
    'MAGIC_LINK_RESENT',
    found.record,
    status,
    status,
    'Magic link resent by administrator.',
    getAdminActor_()
  );

  return adminSuccess_(
    'Magic link sent.'
  );
}

// -----------------------------------------------------------------------------
// Cancel
// -----------------------------------------------------------------------------

function adminCancelRegistration_(
  email
) {
  return withAdminLock_(
    function () {
      const sheet =
        getSheet_();

      const found =
        findRowByEmail_(
          sheet,
          email
        );

      if (!found) {
        return adminError_(
          'Participant not found.'
        );
      }

      const previousStatus =
        normalizedRegistrationStatus_(
          found.record
        );

      if (
        previousStatus ===
        'cancelled'
      ) {
        return adminError_(
          'Registration is already cancelled.'
        );
      }

      const now =
        new Date();

      setCells_(
        sheet,
        found.row,
        {
          registrationStatus:
            'cancelled',

          cancelledAt:
            now,

          checkedIn:
            false,

          checkedInAt:
            '',

          state:
            'cancelled',
        }
      );

      found.record
        .registrationStatus =
        'cancelled';

      found.record
        .cancelledAt =
        now;

      found.record
        .checkedIn =
        false;

      logAudit_(
        'REGISTRATION_CANCELLED',
        found.record,
        previousStatus,
        'cancelled',
        'Registration cancelled by administrator.',
        getAdminActor_()
      );

      return adminSuccess_(
        'Registration cancelled.'
      );
    }
  );
}

// -----------------------------------------------------------------------------
// Restore
// -----------------------------------------------------------------------------

function adminRestoreRegistration_(
  email
) {
  return withAdminLock_(
    function () {
      const sheet =
        getSheet_();

      const found =
        findRowByEmail_(
          sheet,
          email
        );

      if (!found) {
        return adminError_(
          'Participant not found.'
        );
      }

      const previousStatus =
        normalizedRegistrationStatus_(
          found.record
        );

      if (
        previousStatus !==
        'cancelled'
      ) {
        return adminError_(
          'Only cancelled registrations can be restored.'
        );
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
        return adminError_(
          admission.message
        );
      }

      const nextStatus =
        admission
          .registrationStatus;

      const cvStatus =
        normalizedCvStatus_(
          found.record
        );

      setCells_(
        sheet,
        found.row,
        {
          registrationStatus:
            nextStatus,

          cancelledAt:
            '',

          state:
            legacyStateFor_(
              nextStatus,
              cvStatus
            ),
        }
      );

      found.record
        .registrationStatus =
        nextStatus;

      found.record
        .cancelledAt =
        '';

      found.record.state =
        legacyStateFor_(
          nextStatus,
          cvStatus
        );

      sendMagicLink_(
        found.record,
        {
          returning:
            true,

          registrationStatus:
            nextStatus,
        }
      );

      logAudit_(
        'REGISTRATION_RESTORED',
        found.record,
        previousStatus,
        nextStatus,
        'Cancelled registration restored.',
        getAdminActor_()
      );

      return adminSuccess_(
        nextStatus ===
          'waitlisted'
          ? 'Registration restored to the waiting list.'
          : 'Registration restored and confirmed.'
      );
    }
  );
}

// -----------------------------------------------------------------------------
// Waitlist promotion
// -----------------------------------------------------------------------------

function adminPromoteWaitlist_(
  email
) {
  return withAdminLock_(
    function () {
      const sheet =
        getSheet_();

      const found =
        findRowByEmail_(
          sheet,
          email
        );

      if (!found) {
        return adminError_(
          'Participant not found.'
        );
      }

      const previousStatus =
        normalizedRegistrationStatus_(
          found.record
        );

      if (
        previousStatus !==
        'waitlisted'
      ) {
        return adminError_(
          'Participant is not on the waiting list.'
        );
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
        return adminError_(
          'There is currently no confirmed place available.'
        );
      }

      const cvStatus =
        normalizedCvStatus_(
          found.record
        );

      setCells_(
        sheet,
        found.row,
        {
          registrationStatus:
            'confirmed',

          state:
            legacyStateFor_(
              'confirmed',
              cvStatus
            ),
        }
      );

      found.record
        .registrationStatus =
        'confirmed';

      found.record.state =
        legacyStateFor_(
          'confirmed',
          cvStatus
        );

      sendPromotionEmail_(
        found.record
      );

      logAudit_(
        'REGISTRATION_PROMOTED',
        found.record,
        previousStatus,
        'confirmed',
        'Participant promoted from waiting list.',
        getAdminActor_()
      );

      return adminSuccess_(
        'Participant promoted and confirmation email sent.'
      );
    }
  );
}

// -----------------------------------------------------------------------------
// Check-in
// -----------------------------------------------------------------------------

function adminCheckIn_(
  email
) {
  return withAdminLock_(
    function () {
      const sheet =
        getSheet_();

      const found =
        findRowByEmail_(
          sheet,
          email
        );

      if (!found) {
        return adminError_(
          'Participant not found.'
        );
      }

      const previousStatus =
        normalizedRegistrationStatus_(
          found.record
        );

      if (
        previousStatus ===
        'cancelled'
      ) {
        return adminError_(
          'Cancelled registrations cannot check in.'
        );
      }

      if (
        previousStatus ===
        'waitlisted'
      ) {
        return adminError_(
          'Waiting-list participants must be promoted before check-in.'
        );
      }

      if (
        previousStatus ===
        'checked_in'
      ) {
        return adminError_(
          'Participant is already checked in.'
        );
      }

      const now =
        new Date();

      setCells_(
        sheet,
        found.row,
        {
          registrationStatus:
            'checked_in',

          checkedIn:
            true,

          checkedInAt:
            now,

          state:
            'checked_in',
        }
      );

      found.record
        .registrationStatus =
        'checked_in';

      found.record
        .checkedIn =
        true;

      found.record
        .checkedInAt =
        now;

      logAudit_(
        'PARTICIPANT_CHECKED_IN',
        found.record,
        previousStatus,
        'checked_in',
        'Participant checked in by administrator.',
        getAdminActor_()
      );

      return adminSuccess_(
        'Participant checked in.'
      );
    }
  );
}

function adminUndoCheckIn_(
  email
) {
  return withAdminLock_(
    function () {
      const sheet =
        getSheet_();

      const found =
        findRowByEmail_(
          sheet,
          email
        );

      if (!found) {
        return adminError_(
          'Participant not found.'
        );
      }

      const previousStatus =
        normalizedRegistrationStatus_(
          found.record
        );

      if (
        previousStatus !==
        'checked_in'
      ) {
        return adminError_(
          'Participant is not checked in.'
        );
      }

      const cvStatus =
        normalizedCvStatus_(
          found.record
        );

      setCells_(
        sheet,
        found.row,
        {
          registrationStatus:
            'confirmed',

          checkedIn:
            false,

          checkedInAt:
            '',

          state:
            legacyStateFor_(
              'confirmed',
              cvStatus
            ),
        }
      );

      found.record
        .registrationStatus =
        'confirmed';

      found.record
        .checkedIn =
        false;

      found.record
        .checkedInAt =
        '';

      logAudit_(
        'PARTICIPANT_CHECKIN_REVERSED',
        found.record,
        'checked_in',
        'confirmed',
        'Participant check-in reversed by administrator.',
        getAdminActor_()
      );

      return adminSuccess_(
        'Check-in reversed.'
      );
    }
  );
}

// -----------------------------------------------------------------------------
// GDPR delete
// -----------------------------------------------------------------------------

function adminDeleteParticipantData_(
  email
) {
  return withAdminLock_(
    function () {
      const sheet =
        getSheet_();

      const found =
        findRowByEmail_(
          sheet,
          email
        );

      if (!found) {
        return adminError_(
          'Participant not found.'
        );
      }

      const record =
        found.record;

      const auditRecord = {
        registrationId:
          record.registrationId ||
          '',

        email:
          record.email ||
          '',
      };

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
            'Could not trash participant CV during GDPR deletion: ' +
            err
          );
        }
      }

      /*
       * Log before deleting the source row.
       *
       * Audit only keeps registrationId / masked target.
       */
      logAudit_(
        'PARTICIPANT_DELETED',
        auditRecord,
        normalizedRegistrationStatus_(
          record
        ),
        'deleted',
        'Participant personal data permanently removed.',
        getAdminActor_()
      );

      sheet.deleteRow(
        found.row
      );

      return adminSuccess_(
        'Participant data deleted.'
      );
    }
  );
}

// -----------------------------------------------------------------------------
// Health
// -----------------------------------------------------------------------------

function runHealthCheck() {
  const admin =
    getOrCreateAdminSheet_();

  const results = [];

  [
    'SHEET_ID',
    'CV_FOLDER_ID',
    'SITE_URL',
    'EVENT_EMAIL',
  ].forEach(
    function (
      key
    ) {
      checkProperty_(
        results,
        key
      );
    }
  );

  try {
    const sheet =
      getSheet_();

    const map =
      getHeaderMap_(
        sheet
      );

    const missing =
      HEADERS.filter(
        function (
          header
        ) {
          return !map[
            header
          ];
        }
      );

    results.push([
      missing.length ===
        0
        ? '✓'
        : '✗',

      missing.length ===
        0
        ? 'Registration schema'
        : (
            'Missing: ' +
            missing.join(
              ', '
            )
          ),
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

  try {
    const version =
      typeof getSchemaVersion_ ===
        'function'
        ? getSchemaVersion_()
        : 0;

    results.push([
      version ===
        CURRENT_SCHEMA_VERSION
        ? '✓'
        : '⚠',

      'Schema v' +
      version +
      '/' +
      CURRENT_SCHEMA_VERSION,
    ]);
  } catch (err) {
    results.push([
      '✗',
      'Schema version',
    ]);
  }

  admin
    .getRange(
      'D4:E22'
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

function withAdminLock_(
  callback
) {
  const lock =
    LockService
      .getScriptLock();

  lock.waitLock(
    LOCK_TIMEOUT_MS
  );

  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function adminSuccess_(
  message
) {
  return {
    ok:
      true,

    message:
      message,
  };
}

function adminError_(
  message
) {
  return {
    ok:
      false,

    message:
      message,
  };
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
