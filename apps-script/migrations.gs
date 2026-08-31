/**
 * DETI+ 2026 - schema migrations
 *
 * Migrations are:
 *
 * - non-destructive;
 * - idempotent;
 * - backwards-compatible;
 * - safe to run multiple times.
 */

const SCHEMA_VERSION_PROPERTY =
  'SCHEMA_VERSION';

const CURRENT_SCHEMA_VERSION =
  3;

const REGISTRATION_ID_PREFIX =
  'DET26-';

const REGISTRATION_ID_PADDING =
  4;

const MIGRATION_LOCK_TIMEOUT_MS =
  5000;

const CURRENT_REGISTRATION_COLUMNS = [
  'registrationId',
  'course',
  'registrationStatus',
  'cvStatus',
  'registeredAt',
  'cvSubmittedAt',
  'checkedIn',
  'checkedInAt',
  'cancelledAt',
  'notes',
];

// -----------------------------------------------------------------------------
// Public entrypoint
// -----------------------------------------------------------------------------

function migrateSystem() {
  console.log(
    '[migration] Starting...'
  );

  const lock =
    LockService.getScriptLock();

  /*
   * Never sit indefinitely waiting for public registration/admin executions.
   */
  const acquired =
    lock.tryLock(
      MIGRATION_LOCK_TIMEOUT_MS
    );

  if (!acquired) {
    throw new Error(
      'Migration could not acquire the system lock. ' +
      'Another registration/admin execution is currently running. ' +
      'Try migrateSystem() again.'
    );
  }

  try {
    const initialVersion =
      getSchemaVersion_();

    console.log(
      '[migration] Current schema version: ' +
      initialVersion
    );

    /*
     * Important:
     *
     * Open the spreadsheet directly here instead of getSheet_().
     *
     * getSheet_() also performs schema repair, which would make the migration
     * run the same work twice.
     */
    const ss =
      getSpreadsheet_();

    let sheet =
      ss.getSheetByName(
        SHEET_NAME
      );

    if (!sheet) {
      console.log(
        '[migration] Registration sheet does not exist. Creating it.'
      );

      sheet =
        ss.insertSheet(
          SHEET_NAME
        );

      sheet
        .getRange(
          1,
          1,
          1,
          HEADERS.length
        )
        .setValues([
          HEADERS,
        ]);

      setSchemaVersion_(
        CURRENT_SCHEMA_VERSION
      );

      console.log(
        '[migration] Fresh Registration sheet created.'
      );

      return {
        ok:
          true,

        previousVersion:
          initialVersion,

        version:
          CURRENT_SCHEMA_VERSION,

        migratedRows:
          0,
      };
    }

    console.log(
      '[migration] Registration sheet found.'
    );

    /*
     * Ensure current columns once.
     */
    const addedColumns =
      ensureMigrationColumns_(
        sheet
      );

    console.log(
      '[migration] Missing columns added: ' +
      addedColumns
    );

    const result =
      migrateRegistrationData_(
        sheet
      );

    console.log(
      '[migration] Rows inspected: ' +
      result.inspected
    );

    console.log(
      '[migration] Rows changed: ' +
      result.changed
    );

    setSchemaVersion_(
      CURRENT_SCHEMA_VERSION
    );

    SpreadsheetApp.flush();

    console.log(
      '[migration] Completed successfully. Schema v' +
      CURRENT_SCHEMA_VERSION
    );

    return {
      ok:
        true,

      previousVersion:
        initialVersion,

      version:
        CURRENT_SCHEMA_VERSION,

      addedColumns:
        addedColumns,

      inspectedRows:
        result.inspected,

      migratedRows:
        result.changed,
    };
  } finally {
    lock.releaseLock();

    console.log(
      '[migration] Lock released.'
    );
  }
}

// -----------------------------------------------------------------------------
// Schema version
// -----------------------------------------------------------------------------

function getSchemaVersion_() {
  const value =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        SCHEMA_VERSION_PROPERTY
      );

  if (
    value === null ||
    value === ''
  ) {
    return 0;
  }

  const parsed =
    Number(
      value
    );

  if (
    !Number.isFinite(
      parsed
    ) ||
    parsed <
      0
  ) {
    return 0;
  }

  return Math.floor(
    parsed
  );
}

function setSchemaVersion_(
  version
) {
  PropertiesService
    .getScriptProperties()
    .setProperty(
      SCHEMA_VERSION_PROPERTY,
      String(
        version
      )
    );
}

// -----------------------------------------------------------------------------
// Columns
// -----------------------------------------------------------------------------

function ensureMigrationColumns_(
  sheet
) {
  const map =
    getMigrationHeaderMap_(
      sheet
    );

  let added =
    0;

  /*
   * HEADERS contains both canonical and temporary legacy compatibility
   * columns, so use it as the complete transitional schema.
   */
  HEADERS.forEach(
    function (
      header
    ) {
      if (
        map[
          header
        ]
      ) {
        return;
      }

      const nextColumn =
        sheet.getLastColumn() +
        1;

      sheet
        .getRange(
          1,
          nextColumn
        )
        .setValue(
          header
        );

      map[
        header
      ] =
        nextColumn;

      added++;
    }
  );

  return added;
}

function getMigrationHeaderMap_(
  sheet
) {
  const lastColumn =
    sheet.getLastColumn();

  if (
    lastColumn <
    1
  ) {
    return {};
  }

  const headers =
    sheet
      .getRange(
        1,
        1,
        1,
        lastColumn
      )
      .getValues()[0];

  return migrationHeaderMapFromValues_(
    headers
  );
}

function migrationHeaderMapFromValues_(
  headers
) {
  const map = {};

  headers.forEach(
    function (
      value,
      index
    ) {
      const header =
        String(
          value ||
          ''
        ).trim();

      if (
        !header
      ) {
        return;
      }

      if (
        !map[
          header
        ]
      ) {
        map[
          header
        ] =
          index + 1;
      }
    }
  );

  return map;
}

// -----------------------------------------------------------------------------
// Data migration
// -----------------------------------------------------------------------------

function migrateRegistrationData_(
  sheet
) {
  const lastRow =
    sheet.getLastRow();

  const lastColumn =
    sheet.getLastColumn();

  if (
    lastRow <
    2
  ) {
    return {
      inspected:
        0,

      changed:
        0,
    };
  }

  console.log(
    '[migration] Reading ' +
    (
      lastRow -
      1
    ) +
    ' participant rows...'
  );

  /*
   * Read all data once.
   */
  const range =
    sheet.getRange(
      1,
      1,
      lastRow,
      lastColumn
    );

  const values =
    range.getValues();

  const map =
    migrationHeaderMapFromValues_(
      values[0]
    );

  const usedIds =
    collectMigrationRegistrationIds_(
      values,
      map
    );

  let nextId =
    nextMigrationRegistrationNumber_(
      usedIds
    );

  let inspected =
    0;

  let changedRows =
    0;

  /*
   * Keep the original header row intact.
   */
  const outputRows = [];

  for (
    let rowIndex = 1;
    rowIndex <
    values.length;
    rowIndex++
  ) {
    const row =
      values[
        rowIndex
      ].slice();

    if (
      migrationRowIsEmpty_(
        row,
        map
      )
    ) {
      outputRows.push(
        row
      );

      continue;
    }

    inspected++;

    let rowChanged =
      false;

    // -----------------------------------------------------------------------
    // Legacy source values
    // -----------------------------------------------------------------------

    const legacyState =
      migrationString_(
        migrationGet_(
          row,
          map,
          'state'
        )
      )
        .toLowerCase();

    const cvFileId =
      migrationString_(
        migrationGet_(
          row,
          map,
          'cvFileId'
        )
      );

    const legacyCourse =
      migrationFirstString_([
        migrationGet_(
          row,
          map,
          'course'
        ),

        migrationGet_(
          row,
          map,
          'curse'
        ),
      ]);

    const legacyRegisteredAt =
      migrationFirstRaw_([
        migrationGet_(
          row,
          map,
          'registeredAt'
        ),

        migrationGet_(
          row,
          map,
          'timestamp'
        ),
      ]);

    // -----------------------------------------------------------------------
    // registrationId
    // -----------------------------------------------------------------------

    if (
      migrationIsEmpty_(
        migrationGet_(
          row,
          map,
          'registrationId'
        )
      )
    ) {
      let id;

      do {
        id =
          formatRegistrationId_(
            nextId
          );

        nextId++;
      } while (
        usedIds[
          id
        ]
      );

      migrationSet_(
        row,
        map,
        'registrationId',
        id
      );

      usedIds[
        id
      ] =
        true;

      rowChanged =
        true;
    }

    // -----------------------------------------------------------------------
    // course
    // -----------------------------------------------------------------------

    if (
      migrationIsEmpty_(
        migrationGet_(
          row,
          map,
          'course'
        )
      ) &&
      legacyCourse
    ) {
      migrationSet_(
        row,
        map,
        'course',
        legacyCourse
      );

      rowChanged =
        true;
    }

    // -----------------------------------------------------------------------
    // registrationStatus
    // -----------------------------------------------------------------------

    const currentRegistrationStatus = String(migrationGet_(row, map, 'registrationStatus') || '').trim().toLowerCase();
    const legacyCheckedIn = legacyState === 'checked_in';
    if (currentRegistrationStatus === 'checked_in' || legacyCheckedIn) {
      migrationSet_(row, map, 'registrationStatus', 'confirmed');
      migrationSet_(row, map, 'checkedIn', true);
      rowChanged = true;
    } else if (
      migrationIsEmpty_(
        migrationGet_(
          row,
          map,
          'registrationStatus'
        )
      )
    ) {
      migrationSet_(
        row,
        map,
        'registrationStatus',
        inferMigrationRegistrationStatus_(
          legacyState
        )
      );

      rowChanged =
        true;
    }

    // -----------------------------------------------------------------------
    // cvStatus
    // -----------------------------------------------------------------------

    if (
      migrationIsEmpty_(
        migrationGet_(
          row,
          map,
          'cvStatus'
        )
      )
    ) {
      migrationSet_(
        row,
        map,
        'cvStatus',
        inferMigrationCvStatus_(
          legacyState,
          cvFileId
        )
      );

      rowChanged =
        true;
    }

    // -----------------------------------------------------------------------
    // registeredAt
    // -----------------------------------------------------------------------

    if (
      migrationIsEmpty_(
        migrationGet_(
          row,
          map,
          'registeredAt'
        )
      ) &&
      !migrationIsEmpty_(
        legacyRegisteredAt
      )
    ) {
      migrationSet_(
        row,
        map,
        'registeredAt',
        legacyRegisteredAt
      );

      rowChanged =
        true;
    }

    // -----------------------------------------------------------------------
    // cvSubmittedAt
    // -----------------------------------------------------------------------

    if (
      cvFileId &&
      migrationIsEmpty_(
        migrationGet_(
          row,
          map,
          'cvSubmittedAt'
        )
      )
    ) {
      const firstCvDate =
        migrationFirstRaw_([
          migrationGet_(
            row,
            map,
            'cvUpdatedAt'
          ),

          legacyRegisteredAt,
        ]);

      if (
        !migrationIsEmpty_(
          firstCvDate
        )
      ) {
        migrationSet_(
          row,
          map,
          'cvSubmittedAt',
          firstCvDate
        );

        rowChanged =
          true;
      }
    }

    // -----------------------------------------------------------------------
    // checkedIn
    // -----------------------------------------------------------------------

    if (
      migrationIsEmpty_(
        migrationGet_(
          row,
          map,
          'checkedIn'
        )
      )
    ) {
      const isCheckedIn = legacyCheckedIn;

      migrationSet_(
        row,
        map,
        'checkedIn',
        isCheckedIn
      );

      rowChanged =
        true;
    }

    /*
     * We deliberately do NOT invent:
     *
     * - checkedInAt
     * - cancelledAt
     * - notes
     *
     * Historical data does not contain reliable timestamps for those events.
     */

    outputRows.push(
      row
    );

    if (
      rowChanged
    ) {
      changedRows++;
    }
  }

  /*
   * Only write when migration actually changed something.
   *
   * Crucially, only participant rows are written. The header row is not
   * rewritten.
   */
  if (
    changedRows >
    0
  ) {
    console.log(
      '[migration] Writing migrated participant data...'
    );

    sheet
      .getRange(
        2,
        1,
        outputRows.length,
        lastColumn
      )
      .setValues(
        outputRows
      );
  } else {
    console.log(
      '[migration] No participant data changes required.'
    );
  }

  return {
    inspected:
      inspected,

    changed:
      changedRows,
  };
}

// -----------------------------------------------------------------------------
// State conversion
// -----------------------------------------------------------------------------

function inferMigrationRegistrationStatus_(
  legacyState
) {
  switch (
    legacyState
  ) {
    case 'waitlisted':
      return 'waitlisted';

    case 'cancelled':
      return 'cancelled';

    case 'checked_in':
      return 'confirmed';

    default:
      return 'confirmed';
  }
}

function inferMigrationCvStatus_(
  legacyState,
  cvFileId
) {
  if (
    cvFileId ||
    legacyState ===
      'cv_delivered'
  ) {
    return 'submitted';
  }

  return 'none';
}

// -----------------------------------------------------------------------------
// IDs
// -----------------------------------------------------------------------------

function collectMigrationRegistrationIds_(
  values,
  map
) {
  const used = {};

  const column =
    map.registrationId;

  if (!column) {
    return used;
  }

  for (
    let i = 1;
    i <
    values.length;
    i++
  ) {
    const id =
      migrationString_(
        values[i][
          column - 1
        ]
      );

    if (id) {
      used[
        id
      ] =
        true;
    }
  }

  return used;
}

function nextMigrationRegistrationNumber_(
  used
) {
  let highest =
    0;

  Object.keys(
    used
  ).forEach(
    function (
      id
    ) {
      if (
        id.indexOf(
          REGISTRATION_ID_PREFIX
        ) !== 0
      ) {
        return;
      }

      const number =
        Number(
          id.substring(
            REGISTRATION_ID_PREFIX
              .length
          )
        );

      if (
        Number.isFinite(
          number
        ) &&
        number >
          highest
      ) {
        highest =
          number;
      }
    }
  );

  return highest + 1;
}

function formatRegistrationId_(
  number
) {
  return (
    REGISTRATION_ID_PREFIX +
    String(
      number
    ).padStart(
      REGISTRATION_ID_PADDING,
      '0'
    )
  );
}

// -----------------------------------------------------------------------------
// Row helpers
// -----------------------------------------------------------------------------

function migrationGet_(
  row,
  map,
  header
) {
  const column =
    map[
      header
    ];

  if (!column) {
    return '';
  }

  return row[
    column - 1
  ];
}

function migrationSet_(
  row,
  map,
  header,
  value
) {
  const column =
    map[
      header
    ];

  if (!column) {
    throw new Error(
      'Migration column missing: ' +
      header
    );
  }

  row[
    column - 1
  ] =
    value;
}

function migrationRowIsEmpty_(
  row,
  map
) {
  return (
    !migrationString_(
      migrationGet_(
        row,
        map,
        'email'
      )
    ) &&
    !migrationString_(
      migrationGet_(
        row,
        map,
        'token'
      )
    ) &&
    !migrationString_(
      migrationGet_(
        row,
        map,
        'name'
      )
    )
  );
}

function migrationIsEmpty_(
  value
) {
  return (
    value === '' ||
    value === null ||
    typeof value ===
      'undefined'
  );
}

function migrationString_(
  value
) {
  if (
    value === null ||
    typeof value ===
      'undefined'
  ) {
    return '';
  }

  return String(
    value
  ).trim();
}

function migrationFirstString_(
  values
) {
  for (
    let i = 0;
    i <
    values.length;
    i++
  ) {
    const value =
      migrationString_(
        values[i]
      );

    if (value) {
      return value;
    }
  }

  return '';
}

function migrationFirstRaw_(
  values
) {
  for (
    let i = 0;
    i <
    values.length;
    i++
  ) {
    if (
      !migrationIsEmpty_(
        values[i]
      )
    ) {
      return values[i];
    }
  }

  return '';
}
