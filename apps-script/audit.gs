/**
 * DETI+ 2026 - audit log
 */

const AUDIT_SHEET_NAME =
  'Audit Log';

const AUDIT_HEADERS = [
  'timestamp',
  'action',
  'registrationId',
  'target',
  'previousState',
  'newState',
  'details',
  'actor',
];

// -----------------------------------------------------------------------------
// Sheet
// -----------------------------------------------------------------------------

function getAuditSheet_() {
  const ss =
    getSpreadsheet_();

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

function getAuditSheetFast_() {
  const sheet = getSpreadsheet_().getSheetByName(AUDIT_SHEET_NAME);
  if (!sheet) throw new Error('Audit Log sheet is missing; run initializeOperations.');
  return sheet;
}

function ensureAuditSheet_(
  sheet
) {
  const lastRow =
    sheet.getLastRow();

  if (
    lastRow === 0
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
  } else {
    ensureAuditHeaders_(
      sheet
    );
  }

  sheet.setFrozenRows(
    1
  );

  sheet.setHiddenGridlines(
    true
  );

  const lastColumn =
    sheet.getLastColumn();

  sheet
    .getRange(
      1,
      1,
      1,
      lastColumn
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
    .setVerticalAlignment(
      'middle'
    );

  sheet.setRowHeight(
    1,
    38
  );

  const widths = [
    165,
    230,
    145,
    230,
    160,
    160,
    430,
    230,
  ];

  widths.forEach(
    function (
      width,
      index
    ) {
      if (
        index + 1 <=
        lastColumn
      ) {
        sheet.setColumnWidth(
          index + 1,
          width
        );
      }
    }
  );

  if (
    sheet.getLastRow() >=
    2
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

/**
 * Appends missing headers instead of destructively reordering old audit data.
 */
function ensureAuditHeaders_(
  sheet
) {
  const lastColumn =
    sheet.getLastColumn();

  const values =
    sheet
      .getRange(
        1,
        1,
        1,
        lastColumn
      )
      .getValues()[0];

  const existing = {};

  values.forEach(
    function (
      value,
      index
    ) {
      const key =
        String(
          value ||
          ''
        ).trim();

      if (key) {
        existing[
          key
        ] =
          index + 1;
      }
    }
  );

  AUDIT_HEADERS.forEach(
    function (
      header
    ) {
      if (
        existing[
          header
        ]
      ) {
        return;
      }

      const next =
        sheet.getLastColumn() +
        1;

      sheet
        .getRange(
          1,
          next
        )
        .setValue(
          header
        );
    }
  );
}

// -----------------------------------------------------------------------------
// Logging
// -----------------------------------------------------------------------------

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
      getAuditSheetFast_();

    const registrationId =
      record
        ? String(
            record.registrationId ||
            ''
          )
        : '';

    const target =
      record
        ? auditTarget_(
            record
          )
        : '';

    appendAuditRecord_(
      sheet,
      {
        timestamp:
          new Date(),

        action:
          String(
            action ||
            ''
          ),

        registrationId:
          registrationId,

        target:
          target,

        previousState:
          String(
            previousState ||
            ''
          ),

        newState:
          String(
            newState ||
            ''
          ),

        details:
          String(
            details ||
            ''
          ),

        actor:
          String(
            actor ||
            'SYSTEM'
          ),
      }
    );
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

function appendAuditRecord_(
  sheet,
  record
) {
  const lastColumn =
    sheet.getLastColumn();

  const headers =
    sheet
      .getRange(
        1,
        1,
        1,
        lastColumn
      )
      .getValues()[0]
      .map(
        function (
          value
        ) {
          return String(
            value ||
            ''
          ).trim();
        }
      );

  const row =
    headers.map(
      function (
        header
      ) {
        if (
          Object.prototype
            .hasOwnProperty
            .call(
              record,
              header
            )
        ) {
          return record[
            header
          ];
        }

        /*
         * Legacy audit sheet may still contain "email".
         *
         * Do not write full addresses anymore.
         */
        if (
          header ===
          'email'
        ) {
          return record.target;
        }

        return '';
      }
    );

  sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
}

// -----------------------------------------------------------------------------
// Privacy
// -----------------------------------------------------------------------------

function auditTarget_(
  record
) {
  if (
    record.registrationId
  ) {
    return String(
      record.registrationId
    );
  }

  if (
    record.email
  ) {
    return maskEmail_(
      record.email
    );
  }

  return '';
}

// -----------------------------------------------------------------------------
// Actors
// -----------------------------------------------------------------------------

function getAdminActor_() {
  try {
    const email =
      Session
        .getEffectiveUser()
        .getEmail();

    return (
      email ||
      'ADMIN'
    );
  } catch (err) {
    return 'ADMIN';
  }
}
