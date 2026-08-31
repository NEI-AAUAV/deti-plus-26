/**
 * DETI+ 2026 - schema migrations
 *
 * Migrations are intentionally non-destructive.
 *
 * Legacy columns are kept while the application is gradually moved to the
 * current schema. They can be removed in a later release once every consumer
 * has been migrated.
 */

const SCHEMA_VERSION_PROPERTY =
  'SCHEMA_VERSION';

const CURRENT_SCHEMA_VERSION =
  2;

const REGISTRATION_ID_PREFIX =
  'DET26-';

const REGISTRATION_ID_PADDING =
  4;

/**
 * Current operational schema.
 *
 * Important:
 * legacy fields such as:
 *
 * - timestamp
 * - curse
 * - state
 *
 * are deliberately NOT removed by migrations.
 */
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

/**
 * Public migration entrypoint.
 *
 * Can safely be executed more than once.
 */
function migrateSystem() {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    LOCK_TIMEOUT_MS
  );

  try {
    const initialVersion =
      getSchemaVersion_();

    let version =
      initialVersion;

    /*
     * Version 0 represents a project that existed before versioned
     * migrations were introduced.
     */
    if (
      version < 1
    ) {
      migrateToSchemaVersion1_();

      version = 1;

      setSchemaVersion_(
        version
      );
    }

    if (
      version < 2
    ) {
      migrateToSchemaVersion2_();

      version = 2;

      setSchemaVersion_(
        version
      );
    }

    /*
     * Even when already migrated, repairing the current schema makes the
     * operation idempotent and useful if somebody accidentally removed a
     * column.
     */
    ensureCurrentRegistrationSchema_();

    console.log(
      'DETI+ schema migration completed. ' +
      'Version: ' +
      version
    );

    return {
      ok: true,

      previousVersion:
        initialVersion,

      version:
        version,

      currentVersion:
        CURRENT_SCHEMA_VERSION,
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Returns the currently stored schema version.
 *
 * Missing or invalid values are considered version 0.
 */
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
    Number(value);

  if (
    !Number.isFinite(
      parsed
    ) ||
    parsed < 0
  ) {
    return 0;
  }

  return Math.floor(
    parsed
  );
}

/**
 * Stores the current schema version.
 */
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

/**
 * Version 1 is the historical schema that existed before migrations.
 *
 * There is intentionally no destructive transformation here.
 */
function migrateToSchemaVersion1_() {
  const sheet =
    getSheet_();

  ensureLegacyRegistrationHeaders_(
    sheet
  );

  console.log(
    'Schema v1 baseline established.'
  );
}

/**
 * Version 2 introduces the proper operational registration schema.
 *
 * The old columns stay in place for backwards compatibility.
 */
function migrateToSchemaVersion2_() {
  const sheet =
    getSheet_();

  ensureCurrentRegistrationColumns_(
    sheet
  );

  migrateLegacyRegistrationRows_(
    sheet
  );

  console.log(
    'Schema migrated to v2.'
  );
}

/**
 * Repairs/ensures the latest schema without overwriting participant data.
 */
function ensureCurrentRegistrationSchema_() {
  const sheet =
    getSheet_();

  ensureCurrentRegistrationColumns_(
    sheet
  );

  migrateLegacyRegistrationRows_(
    sheet
  );
}

/**
 * Ensures the old schema is recognizable.
 *
 * This does not reorder or remove anything.
 */
function ensureLegacyRegistrationHeaders_(
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
        HEADERS.length
      )
      .setValues([
        HEADERS,
      ]);

    return;
  }

  const map =
    getRegistrationHeaderMap_(
      sheet
    );

  HEADERS.forEach(
    function (
      header
    ) {
      /*
       * Existing installations should already have these fields.
       *
       * If one is missing, append it rather than changing the physical
       * position of any existing participant data.
       */
      if (
        !map[
          header
        ]
      ) {
        appendRegistrationColumn_(
          sheet,
          header
        );

        map[
          header
        ] =
          sheet.getLastColumn();
      }
    }
  );
}

/**
 * Ensures all current columns exist.
 *
 * Missing columns are appended to the right to avoid moving legacy data.
 */
function ensureCurrentRegistrationColumns_(
  sheet
) {
  const map =
    getRegistrationHeaderMap_(
      sheet
    );

  CURRENT_REGISTRATION_COLUMNS
    .forEach(
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

        appendRegistrationColumn_(
          sheet,
          header
        );

        map[
          header
        ] =
          sheet.getLastColumn();
      }
    );
}

/**
 * Appends a single schema column.
 */
function appendRegistrationColumn_(
  sheet,
  header
) {
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
}

/**
 * Migrates existing participant rows into the new fields.
 *
 * This operation is idempotent:
 *
 * - already populated new fields are retained;
 * - empty new fields are populated from legacy data;
 * - legacy values are never deleted here.
 */
function migrateLegacyRegistrationRows_(
  sheet
) {
  const lastRow =
    sheet.getLastRow();

  if (
    lastRow < 2
  ) {
    return;
  }

  const lastColumn =
    sheet.getLastColumn();

  const values =
    sheet
      .getRange(
        1,
        1,
        lastRow,
        lastColumn
      )
      .getValues();

  const headers =
    values[0].map(
      function (
        value
      ) {
        return String(
          value || ''
        ).trim();
      }
    );

  const map =
    headerMapFromValues_(
      headers
    );

  const usedRegistrationIds =
    collectRegistrationIds_(
      values,
      map
    );

  let nextRegistrationNumber =
    getNextRegistrationNumber_(
      usedRegistrationIds
    );

  let changed =
    false;

  for (
    let rowIndex = 1;
    rowIndex <
    values.length;
    rowIndex++
  ) {
    const row =
      values[
        rowIndex
      ];

    if (
      isRegistrationRowEmpty_(
        row,
        map
      )
    ) {
      continue;
    }

    const legacyState =
      normalizedMigrationValue_(
        valueByMappedHeader_(
          row,
          map,
          'state'
        )
      ).toLowerCase();

    const cvFileId =
      normalizedMigrationValue_(
        valueByMappedHeader_(
          row,
          map,
          'cvFileId'
        )
      );

    const course =
      firstNonEmptyMigrationValue_([
        valueByMappedHeader_(
          row,
          map,
          'course'
        ),

        valueByMappedHeader_(
          row,
          map,
          'curse'
        ),
      ]);

    const registeredAt =
      firstNonEmptyRawValue_([
        valueByMappedHeader_(
          row,
          map,
          'registeredAt'
        ),

        valueByMappedHeader_(
          row,
          map,
          'timestamp'
        ),
      ]);

    const registrationStatus =
      inferRegistrationStatus_(
        legacyState
      );

    const cvStatus =
      inferCvStatus_(
        row,
        map,
        legacyState,
        cvFileId
      );

    /*
     * registrationId
     */
    if (
      isMappedCellEmpty_(
        row,
        map,
        'registrationId'
      )
    ) {
      let registrationId;

      do {
        registrationId =
          formatRegistrationId_(
            nextRegistrationNumber
          );

        nextRegistrationNumber++;
      } while (
        usedRegistrationIds[
          registrationId
        ]
      );

      setMappedCellValue_(
        row,
        map,
        'registrationId',
        registrationId
      );

      usedRegistrationIds[
        registrationId
      ] =
        true;

      changed =
        true;
    }

    /*
     * course
     */
    if (
      isMappedCellEmpty_(
        row,
        map,
        'course'
      ) &&
      course !== ''
    ) {
      setMappedCellValue_(
        row,
        map,
        'course',
        course
      );

      changed =
        true;
    }

    /*
     * registrationStatus
     */
    if (
      isMappedCellEmpty_(
        row,
        map,
        'registrationStatus'
      )
    ) {
      setMappedCellValue_(
        row,
        map,
        'registrationStatus',
        registrationStatus
      );

      changed =
        true;
    }

    /*
     * cvStatus
     */
    if (
      isMappedCellEmpty_(
        row,
        map,
        'cvStatus'
      )
    ) {
      setMappedCellValue_(
        row,
        map,
        'cvStatus',
        cvStatus
      );

      changed =
        true;
    }

    /*
     * registeredAt
     */
    if (
      isMappedCellEmpty_(
        row,
        map,
        'registeredAt'
      ) &&
      registeredAt !== ''
    ) {
      setMappedCellValue_(
        row,
        map,
        'registeredAt',
        registeredAt
      );

      changed =
        true;
    }

    /*
     * For legacy rows we only know the latest stored CV timestamp.
     *
     * If a participant already has a CV, cvUpdatedAt is the best available
     * historical value for the initial submission time.
     */
    if (
      cvFileId !== '' &&
      isMappedCellEmpty_(
        row,
        map,
        'cvSubmittedAt'
      )
    ) {
      const legacyCvDate =
        firstNonEmptyRawValue_([
          valueByMappedHeader_(
            row,
            map,
            'cvUpdatedAt'
          ),

          registeredAt,
        ]);

      if (
        legacyCvDate !== ''
      ) {
        setMappedCellValue_(
          row,
          map,
          'cvSubmittedAt',
          legacyCvDate
        );

        changed =
          true;
      }
    }

    /*
     * checkedIn defaults to FALSE for existing rows.
     */
    if (
      isMappedCellEmpty_(
        row,
        map,
        'checkedIn'
      )
    ) {
      setMappedCellValue_(
        row,
        map,
        'checkedIn',
        false
      );

      changed =
        true;
    }

    /*
     * cancelledAt cannot be accurately reconstructed from the old schema.
     * Leave it blank rather than inventing a timestamp.
     *
     * checkedInAt and notes are also intentionally left blank.
     */
  }

  if (
    changed
  ) {
    sheet
      .getRange(
        1,
        1,
        values.length,
        headers.length
      )
      .setValues(
        values
      );
  }
}

/**
 * Infers registration status from the old combined state.
 */
function inferRegistrationStatus_(
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
      return 'checked_in';

    case 'registered':
    case 'cv_delivered':
    case '':
    default:
      return 'confirmed';
  }
}

/**
 * Infers CV status using the information that actually exists.
 *
 * Legacy data cannot reliably tell whether a file was replaced multiple
 * times, so historical CVs are migrated as "submitted".
 */
function inferCvStatus_(
  row,
  map,
  legacyState,
  cvFileId
) {
  const existingStatus =
    normalizedMigrationValue_(
      valueByMappedHeader_(
        row,
        map,
        'cvStatus'
      )
    ).toLowerCase();

  if (
    existingStatus !== ''
  ) {
    return existingStatus;
  }

  if (
    cvFileId !== '' ||
    legacyState ===
      'cv_delivered'
  ) {
    return 'submitted';
  }

  return 'none';
}

/**
 * Builds a header → 1-based column map from the live spreadsheet.
 */
function getRegistrationHeaderMap_(
  sheet
) {
  const lastColumn =
    sheet.getLastColumn();

  if (
    lastColumn < 1
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
      .getValues()[0]
      .map(
        function (
          value
        ) {
          return String(
            value || ''
          ).trim();
        }
      );

  return headerMapFromValues_(
    headers
  );
}

/**
 * Converts a headers array into a 1-based column map.
 */
function headerMapFromValues_(
  headers
) {
  const map = {};

  headers.forEach(
    function (
      header,
      index
    ) {
      if (
        !header
      ) {
        return;
      }

      /*
       * Preserve the first matching column if duplicate headers somehow
       * exist. Duplicates should be fixed manually, not silently remapped.
       */
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

/**
 * Returns one cell from a row using a 1-based header map.
 */
function valueByMappedHeader_(
  row,
  map,
  header
) {
  const column =
    map[
      header
    ];

  if (
    !column
  ) {
    return '';
  }

  return row[
    column - 1
  ];
}

/**
 * Writes one in-memory row value through the live header map.
 */
function setMappedCellValue_(
  row,
  map,
  header,
  value
) {
  const column =
    map[
      header
    ];

  if (
    !column
  ) {
    throw new Error(
      'Missing registration column: ' +
      header
    );
  }

  row[
    column - 1
  ] =
    value;
}

/**
 * Determines whether a mapped cell is empty.
 */
function isMappedCellEmpty_(
  row,
  map,
  header
) {
  const value =
    valueByMappedHeader_(
      row,
      map,
      header
    );

  return (
    value === '' ||
    value === null ||
    typeof value ===
      'undefined'
  );
}

/**
 * Ignores genuinely empty spreadsheet rows.
 */
function isRegistrationRowEmpty_(
  row,
  map
) {
  const email =
    normalizedMigrationValue_(
      valueByMappedHeader_(
        row,
        map,
        'email'
      )
    );

  const token =
    normalizedMigrationValue_(
      valueByMappedHeader_(
        row,
        map,
        'token'
      )
    );

  const name =
    normalizedMigrationValue_(
      valueByMappedHeader_(
        row,
        map,
        'name'
      )
    );

  return (
    email === '' &&
    token === '' &&
    name === ''
  );
}

/**
 * Collects all existing registration IDs.
 */
function collectRegistrationIds_(
  values,
  map
) {
  const used = {};

  const column =
    map.registrationId;

  if (
    !column
  ) {
    return used;
  }

  for (
    let rowIndex = 1;
    rowIndex <
    values.length;
    rowIndex++
  ) {
    const value =
      normalizedMigrationValue_(
        values[
          rowIndex
        ][
          column - 1
        ]
      );

    if (
      value !== ''
    ) {
      used[
        value
      ] =
        true;
    }
  }

  return used;
}

/**
 * Finds the next sequential DET26 number.
 */
function getNextRegistrationNumber_(
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

      const suffix =
        id.substring(
          REGISTRATION_ID_PREFIX
            .length
        );

      const number =
        Number(
          suffix
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

/**
 * Formats the human-friendly internal registration ID.
 */
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

/**
 * String-normalizes migration values.
 */
function normalizedMigrationValue_(
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

/**
 * Returns the first non-empty normalized string.
 */
function firstNonEmptyMigrationValue_(
  values
) {
  for (
    let i = 0;
    i <
    values.length;
    i++
  ) {
    const normalized =
      normalizedMigrationValue_(
        values[
          i
        ]
      );

    if (
      normalized !== ''
    ) {
      return normalized;
    }
  }

  return '';
}

/**
 * Returns the first non-empty raw value.
 *
 * This preserves Date instances from Google Sheets instead of converting
 * timestamps into strings.
 */
function firstNonEmptyRawValue_(
  values
) {
  for (
    let i = 0;
    i <
    values.length;
    i++
  ) {
    const value =
      values[
        i
      ];

    if (
      value !== '' &&
      value !== null &&
      typeof value !==
        'undefined'
    ) {
      return value;
    }
  }

  return '';
}
