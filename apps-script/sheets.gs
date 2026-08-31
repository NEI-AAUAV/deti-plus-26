/**
 * DETI+ 2026 - Google Sheets storage
 */

// -----------------------------------------------------------------------------
// Spreadsheet
// -----------------------------------------------------------------------------

function getSpreadsheet_() {
  return SpreadsheetApp.openById(
    prop_(
      'SHEET_ID'
    )
  );
}

// -----------------------------------------------------------------------------
// Registration sheet
// -----------------------------------------------------------------------------

function getSheet_() {
  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(
      SHEET_NAME
    );

  if (!sheet) {
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

    sheet.setFrozenRows(
      1
    );
  }

  ensureRegistrationColumns_(
    sheet
  );

  return sheet;
}

/**
 * Ensures every canonical header exists.
 *
 * Existing columns are NEVER reordered automatically.
 * Missing ones are appended to the right.
 */
function ensureRegistrationColumns_(
  sheet
) {
  if (
    sheet.getLastRow() ===
    0
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
    getHeaderMap_(
      sheet
    );

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

      const column =
        Math.max(
          sheet.getLastColumn() +
            1,
          1
        );

      sheet
        .getRange(
          1,
          column
        )
        .setValue(
          header
        );

      map[
        header
      ] =
        column;
    }
  );
}

/**
 * Reads the physical header row.
 *
 * Returns:
 *
 * {
 *   email: 5,
 *   registrationStatus: 9,
 *   ...
 * }
 *
 * Column numbers are 1-based.
 */
function getHeaderMap_(
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
        map[
          header
        ]
      ) {
        /*
         * Duplicate headers are unsafe.
         *
         * Keep the first one and report the problem.
         */
        console.warn(
          'Duplicate Registration header: ' +
          header
        );

        return;
      }

      map[
        header
      ] =
        index + 1;
    }
  );

  return map;
}

function readRecords_(
  sheet
) {
  const lastRow =
    sheet.getLastRow();

  const lastColumn =
    sheet.getLastColumn();

  if (
    lastRow <
      2 ||
    lastColumn <
      1
  ) {
    return [];
  }

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
          value ||
          ''
        ).trim();
      }
    );

  const records = [];

  for (
    let i = 1;
    i <
    values.length;
    i++
  ) {
    const record = {};

    headers.forEach(
      function (
        header,
        column
      ) {
        if (
          !header
        ) {
          return;
        }

        record[
          header
        ] =
          values[i][
            column
          ];
      }
    );

    records.push({
      row:
        i + 1,

      record:
        record,
    });
  }

  return records;
}

function appendRegistration_(
  sheet,
  record
) {
  ensureRegistrationColumns_(
    sheet
  );

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
          !header
        ) {
          return '';
        }

        const value =
          record[
            header
          ];

        return typeof value ===
          'undefined'
          ? ''
          : value;
      }
    );

  sheet.appendRow(
    row
  );
}

function findRowByToken_(
  sheet,
  token
) {
  const normalizedToken =
    String(
      token ||
      ''
    ).trim();

  if (
    !normalizedToken
  ) {
    return null;
  }

  const rows =
    readRecords_(
      sheet
    );

  for (
    let i = 0;
    i <
    rows.length;
    i++
  ) {
    if (
      String(
        rows[i]
          .record
          .token ||
        ''
      ) ===
      normalizedToken
    ) {
      return rows[i];
    }
  }

  return null;
}

function findRowByEmail_(
  sheet,
  email
) {
  const normalizedEmail =
    normalizeEmail_(
      email
    );

  const rows =
    readRecords_(
      sheet
    );

  for (
    let i = 0;
    i <
    rows.length;
    i++
  ) {
    if (
      normalizeEmail_(
        rows[i]
          .record
          .email
      ) ===
      normalizedEmail
    ) {
      return rows[i];
    }
  }

  return null;
}

/**
 * Updates arbitrary fields without depending on physical column positions.
 *
 * Values are grouped into contiguous ranges wherever possible.
 */
function setCells_(
  sheet,
  row,
  updates
) {
  const map =
    getHeaderMap_(
      sheet
    );

  const entries =
    Object.keys(
      updates
    )
      .map(
        function (
          key
        ) {
          return {
            key:
              key,

            column:
              map[
                key
              ],

            value:
              updates[
                key
              ],
          };
        }
      )
      .filter(
        function (
          entry
        ) {
          if (
            !entry.column
          ) {
            console.warn(
              'Ignoring update for missing Registration column: ' +
              entry.key
            );

            return false;
          }

          return true;
        }
      )
      .sort(
        function (
          a,
          b
        ) {
          return (
            a.column -
            b.column
          );
        }
      );

  if (
    !entries.length
  ) {
    return;
  }

  /*
   * Google Sheets RangeList does not support different values for every cell
   * in one operation, so contiguous updates are grouped into setValues().
   */
  let group = [
    entries[0],
  ];

  for (
    let i = 1;
    i <
    entries.length;
    i++
  ) {
    const current =
      entries[i];

    const previous =
      group[
        group.length -
        1
      ];

    if (
      current.column ===
      previous.column +
        1
    ) {
      group.push(
        current
      );
    } else {
      writeCellGroup_(
        sheet,
        row,
        group
      );

      group = [
        current,
      ];
    }
  }

  writeCellGroup_(
    sheet,
    row,
    group
  );
}

function writeCellGroup_(
  sheet,
  row,
  group
) {
  if (
    !group.length
  ) {
    return;
  }

  const firstColumn =
    group[0]
      .column;

  sheet
    .getRange(
      row,
      firstColumn,
      1,
      group.length
    )
    .setValues([
      group.map(
        function (
          entry
        ) {
          return entry.value;
        }
      ),
    ]);
}

// -----------------------------------------------------------------------------
// Registration IDs
// -----------------------------------------------------------------------------

function createNextRegistrationId_(
  sheet
) {
  const rows =
    readRecords_(
      sheet
    );

  let highest =
    0;

  rows.forEach(
    function (
      entry
    ) {
      const id =
        String(
          entry.record
            .registrationId ||
          ''
        )
          .trim()
          .toUpperCase();

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

  return formatRegistrationId_(
    highest + 1
  );
}

// -----------------------------------------------------------------------------
// Registration presentation
// -----------------------------------------------------------------------------

function formatRegistrationSheet_(
  sheet
) {
  ensureRegistrationColumns_(
    sheet
  );

  const lastRow =
    sheet.getLastRow();

  const lastColumn =
    sheet.getLastColumn();

  const map =
    getHeaderMap_(
      sheet
    );

  sheet.setFrozenRows(
    1
  );

  sheet.setHiddenGridlines(
    true
  );

  const header =
    sheet.getRange(
      1,
      1,
      1,
      lastColumn
    );

  header
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
    )
    .setHorizontalAlignment(
      'left'
    )
    .setWrap(
      false
    );

  sheet.setRowHeight(
    1,
    38
  );

  const widths = {
    registrationId:
      130,

    registeredAt:
      155,

    token:
      280,

    name:
      210,

    email:
      230,

    mobileNumber:
      145,

    course:
      230,

    year:
      100,

    registrationStatus:
      155,

    cvStatus:
      120,

    hasCvConsent:
      130,

    hasGdprConsent:
      145,

    cvFileId:
      280,

    cvName:
      270,

    cvSubmittedAt:
      155,

    cvUpdatedAt:
      155,

    checkedIn:
      105,

    checkedInAt:
      155,

    cancelledAt:
      155,

    notes:
      320,

    /*
     * Legacy.
     */
    timestamp:
      155,

    curse:
      230,

    state:
      130,
  };

  Object.keys(
    widths
  ).forEach(
    function (
      name
    ) {
      const column =
        map[
          name
        ];

      if (
        column
      ) {
        sheet.setColumnWidth(
          column,
          widths[
            name
          ]
        );
      }
    }
  );

  if (
    lastRow >=
    2
  ) {
    const body =
      sheet.getRange(
        2,
        1,
        lastRow - 1,
        lastColumn
      );

    body
      .setVerticalAlignment(
        'middle'
      )
      .setWrap(
        false
      );

    [
      'registeredAt',
      'cvSubmittedAt',
      'cvUpdatedAt',
      'checkedInAt',
      'cancelledAt',
      'timestamp',
    ].forEach(
      function (
        headerName
      ) {
        const column =
          map[
            headerName
          ];

        if (
          !column
        ) {
          return;
        }

        sheet
          .getRange(
            2,
            column,
            lastRow - 1,
            1
          )
          .setNumberFormat(
            'dd/mm/yyyy hh:mm'
          );
      }
    );

    ensureCheckedInCheckboxes_(
      sheet,
      map,
      lastRow
    );

    formatRegistrationStatuses_(
      sheet,
      map,
      lastRow
    );

    formatCvStatuses_(
      sheet,
      map,
      lastRow
    );
  }

  const existingFilter =
    sheet.getFilter();

  if (
    !existingFilter &&
    lastRow >=
      1
  ) {
    sheet
      .getRange(
        1,
        1,
        Math.max(
          lastRow,
          1
        ),
        lastColumn
      )
      .createFilter();
  }

  hideRegistrationTechnicalColumns_(
    sheet,
    map
  );
}

function ensureCheckedInCheckboxes_(
  sheet,
  map,
  lastRow
) {
  const column =
    map.checkedIn;

  if (
    !column ||
    lastRow <
      2
  ) {
    return;
  }

  sheet
    .getRange(
      2,
      column,
      lastRow - 1,
      1
    )
    .insertCheckboxes();
}

function formatRegistrationStatuses_(
  sheet,
  map,
  lastRow
) {
  const column =
    map.registrationStatus;

  if (
    !column ||
    lastRow <
      2
  ) {
    return;
  }

  const range =
    sheet.getRange(
      2,
      column,
      lastRow - 1,
      1
    );

  const values =
    range.getValues();

  const backgrounds = [];
  const fontColors = [];
  const fontWeights = [];

  values.forEach(
    function (
      row
    ) {
      const status =
        String(
          row[0] ||
          ''
        )
          .trim()
          .toLowerCase();

      let background =
        '#f3f4f6';

      let fontColor =
        '#374151';

      if (
        status ===
        'confirmed'
      ) {
        background =
          '#ecfdf5';

        fontColor =
          '#047857';
      } else if (
        status ===
        'waitlisted'
      ) {
        background =
          '#fffbeb';

        fontColor =
          '#b45309';
      } else if (
        status ===
        'cancelled'
      ) {
        background =
          '#fef2f2';

        fontColor =
          '#b91c1c';
      } else if (
        status ===
        'checked_in'
      ) {
        background =
          '#eff6ff';

        fontColor =
          '#1d4ed8';
      }

      backgrounds.push([
        background,
      ]);

      fontColors.push([
        fontColor,
      ]);

      fontWeights.push([
        'bold',
      ]);
    }
  );

  range
    .setBackgrounds(
      backgrounds
    )
    .setFontColors(
      fontColors
    )
    .setFontWeights(
      fontWeights
    );
}

function formatCvStatuses_(
  sheet,
  map,
  lastRow
) {
  const column =
    map.cvStatus;

  if (
    !column ||
    lastRow <
      2
  ) {
    return;
  }

  const range =
    sheet.getRange(
      2,
      column,
      lastRow - 1,
      1
    );

  const values =
    range.getValues();

  const backgrounds = [];
  const fontColors = [];

  values.forEach(
    function (
      row
    ) {
      const status =
        String(
          row[0] ||
          ''
        )
          .trim()
          .toLowerCase();

      if (
        status ===
          'submitted' ||
        status ===
          'updated'
      ) {
        backgrounds.push([
          '#ecfdf5',
        ]);

        fontColors.push([
          '#047857',
        ]);
      } else {
        backgrounds.push([
          '#f3f4f6',
        ]);

        fontColors.push([
          '#6b7280',
        ]);
      }
    }
  );

  range
    .setBackgrounds(
      backgrounds
    )
    .setFontColors(
      fontColors
    );
}

function hideRegistrationTechnicalColumns_(
  sheet,
  map
) {
  [
    'token',
    'cvFileId',

    /*
     * Legacy columns should stay available during the migration, but there is
     * no reason to show them operationally.
     */
    'timestamp',
    'curse',
    'state',
  ].forEach(
    function (
      header
    ) {
      const column =
        map[
          header
        ];

      if (
        column
      ) {
        sheet.hideColumns(
          column
        );
      }
    }
  );
}

// -----------------------------------------------------------------------------
// Settings sheet
// -----------------------------------------------------------------------------

function getSettingsSheet_() {
  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(
      SETTINGS_SHEET_NAME
    );

  if (!sheet) {
    sheet =
      ss.insertSheet(
        SETTINGS_SHEET_NAME
      );
  }

  ensureSettingsSheet_(
    sheet
  );

  return sheet;
}

/**
 * Creates missing settings without overwriting existing values.
 */
function ensureSettingsSheet_(
  sheet
) {
  const lastRow =
    sheet.getLastRow();

  if (
    lastRow ===
    0
  ) {
    sheet
      .getRange(
        1,
        1,
        1,
        3
      )
      .setValues([
        [
          'Setting',
          'Value',
          'Description',
        ],
      ]);
  }

  const existing =
    getExistingSettingKeys_(
      sheet
    );

  SETTINGS_DEFINITIONS.forEach(
    function (
      definition
    ) {
      if (
        existing[
          definition.key
        ]
      ) {
        return;
      }

      sheet.appendRow([
        definition.key,
        definition.defaultValue,
        definition.description,
      ]);
    }
  );

  formatSettingsSheet_(
    sheet
  );
}

/**
 * Reads the Settings sheet into an object.
 */
function getSettingsMap_() {
  const sheet =
    getSettingsSheet_();

  const lastRow =
    sheet.getLastRow();

  const settings = {};

  if (
    lastRow <
    2
  ) {
    return settings;
  }

  const values =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        2
      )
      .getValues();

  values.forEach(
    function (
      row
    ) {
      const key =
        String(
          row[0] ||
          ''
        ).trim();

      if (!key) {
        return;
      }

      settings[
        key
      ] =
        row[1];
    }
  );

  return settings;
}

function getExistingSettingKeys_(
  sheet
) {
  const result = {};

  const lastRow =
    sheet.getLastRow();

  if (
    lastRow <
    2
  ) {
    return result;
  }

  const values =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        1
      )
      .getValues();

  values.forEach(
    function (
      row
    ) {
      const key =
        String(
          row[0] ||
          ''
        ).trim();

      if (key) {
        result[
          key
        ] =
          true;
      }
    }
  );

  return result;
}

function formatSettingsSheet_(
  sheet
) {
  const lastRow =
    sheet.getLastRow();

  sheet.setFrozenRows(
    1
  );

  sheet.setHiddenGridlines(
    true
  );

  sheet.setColumnWidth(
    1,
    220
  );

  sheet.setColumnWidth(
    2,
    220
  );

  sheet.setColumnWidth(
    3,
    520
  );

  const header =
    sheet.getRange(
      1,
      1,
      1,
      3
    );

  header
    .setBackground(
      '#111827'
    )
    .setFontColor(
      '#ffffff'
    )
    .setFontWeight(
      'bold'
    )
    .setHorizontalAlignment(
      'left'
    )
    .setVerticalAlignment(
      'middle'
    );

  sheet.setRowHeight(
    1,
    38
  );

  if (
    lastRow <
    2
  ) {
    return;
  }

  const body =
    sheet.getRange(
      2,
      1,
      lastRow - 1,
      3
    );

  body
    .setVerticalAlignment(
      'middle'
    )
    .setWrap(
      true
    );

  sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      1
    )
    .setFontWeight(
      'bold'
    )
    .setFontColor(
      '#111827'
    );

  sheet
    .getRange(
      2,
      3,
      lastRow - 1,
      1
    )
    .setFontColor(
      '#6b7280'
    );

  sheet
    .getRange(
      2,
      2,
      lastRow - 1,
      1
    )
    .setBackground(
      '#f9fafb'
    );

  applySettingsValidation_(
    sheet
  );
}

function applySettingsValidation_(
  sheet
) {
  const lastRow =
    sheet.getLastRow();

  if (
    lastRow <
    2
  ) {
    return;
  }

  const keys =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        1
      )
      .getValues();

  keys.forEach(
    function (
      row,
      index
    ) {
      const key =
        String(
          row[0] ||
          ''
        ).trim();

      const sheetRow =
        index + 2;

      const definition =
        findSettingDefinition_(
          key
        );

      if (!definition) {
        return;
      }

      const valueCell =
        sheet.getRange(
          sheetRow,
          2
        );

      valueCell
        .clearDataValidations();

      if (
        definition.type ===
        'boolean'
      ) {
        valueCell
          .insertCheckboxes();

        return;
      }

      if (
        definition.type ===
        'number'
      ) {
        const validation =
          SpreadsheetApp
            .newDataValidation()
            .requireNumberGreaterThanOrEqualTo(
              0
            )
            .setAllowInvalid(
              false
            )
            .build();

        valueCell
          .setDataValidation(
            validation
          );

        valueCell
          .setNumberFormat(
            '0'
          );

        return;
      }

      if (
        definition.type ===
        'date'
      ) {
        valueCell
          .setNumberFormat(
            'dd/mm/yyyy hh:mm'
          );
      }
    }
  );
}

function findSettingDefinition_(
  key
) {
  for (
    let i = 0;
    i <
    SETTINGS_DEFINITIONS.length;
    i++
  ) {
    if (
      SETTINGS_DEFINITIONS[
        i
      ].key ===
      key
    ) {
      return SETTINGS_DEFINITIONS[
        i
      ];
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// Generic sheet helpers
// -----------------------------------------------------------------------------

function getOrCreateSheet_(
  name
) {
  const ss =
    getSpreadsheet_();

  return (
    ss.getSheetByName(
      name
    ) ||
    ss.insertSheet(
      name
    )
  );
}

function ensureSheetSize_(
  sheet,
  requiredRows,
  requiredColumns
) {
  if (
    sheet.getMaxRows() <
    requiredRows
  ) {
    sheet.insertRowsAfter(
      sheet.getMaxRows(),
      requiredRows -
        sheet.getMaxRows()
    );
  }

  if (
    sheet.getMaxColumns() <
    requiredColumns
  ) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      requiredColumns -
        sheet.getMaxColumns()
    );
  }
}
