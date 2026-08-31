/**
 * DETI+ 2026 - audit log
 */

const AUDIT_SHEET_NAME = 'Audit Log';

const AUDIT_HEADERS = [
  'timestamp',
  'action',
  'email',
  'previousState',
  'newState',
  'details',
  'actor',
];

function getAuditSheet_() {
  const ss = getSpreadsheet_();

  let sheet =
    ss.getSheetByName(
      AUDIT_SHEET_NAME
    );

  if (!sheet) {
    sheet =
      ss.insertSheet(
        AUDIT_SHEET_NAME
      );
  }

  ensureAuditSheet_(
    sheet
  );

  return sheet;
}

function ensureAuditSheet_(
  sheet
) {
  if (
    sheet.getLastRow() === 0
  ) {
    sheet
      .getRange(
        1,
        1,
        1,
        AUDIT_HEADERS.length
      )
      .setValues([
        AUDIT_HEADERS,
      ]);
  }

  sheet.setFrozenRows(1);
  sheet.setHiddenGridlines(true);

  sheet
    .getRange(
      1,
      1,
      1,
      AUDIT_HEADERS.length
    )
    .setBackground('#111827')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 210);
  sheet.setColumnWidth(3, 230);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 150);
  sheet.setColumnWidth(6, 420);
  sheet.setColumnWidth(7, 230);

  if (
    sheet.getLastRow() >= 2
  ) {
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        1
      )
      .setNumberFormat(
        'dd/mm/yyyy hh:mm:ss'
      );
  }
}

function logAudit_(
  action,
  record,
  previousState,
  newState,
  details,
  actor
) {
  try {
    const sheet =
      getAuditSheet_();

    sheet.appendRow([
      new Date(),

      String(
        action || ''
      ),

      record
        ? String(
            record.email ||
            ''
          )
        : '',

      String(
        previousState ||
        ''
      ),

      String(
        newState ||
        ''
      ),

      String(
        details ||
        ''
      ),

      String(
        actor ||
        'system'
      ),
    ]);
  } catch (err) {
    /*
     * Audit failure must never break a public registration.
     */
    console.error(
      'Audit log failure: ' +
      (
        err &&
        err.stack
          ? err.stack
          : err
      )
    );
  }
}

function getAdminActor_() {
  try {
    const email =
      Session
        .getEffectiveUser()
        .getEmail();

    return (
      email ||
      'admin'
    );
  } catch (err) {
    return 'admin';
  }
}
