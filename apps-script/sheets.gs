/**
 * DETI+ 2026 - Google Sheets storage
 */

// -----------------------------------------------------------------------------
// Spreadsheet
// -----------------------------------------------------------------------------

function getSpreadsheet_() {
  return SpreadsheetApp.openById(prop_('SHEET_ID'));
}

// -----------------------------------------------------------------------------
// Registration sheet
// -----------------------------------------------------------------------------

function getSheet_() {
  const ss = getSpreadsheet_();
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

    HEADERS.forEach(function (header, column) {
      record[header] = values[i][column];
    });

    records.push({
      row: i + 1,
      record: record,
    });
  }

  return records;
}

function findRowByToken_(sheet, token) {
  const normalizedToken = String(token || '').trim();

  if (!normalizedToken) {
    return null;
  }

  const rows = readRecords_(sheet);

  for (let i = 0; i < rows.length; i++) {
    if (
      String(rows[i].record.token) === normalizedToken
    ) {
      return rows[i];
    }
  }

  return null;
}

function findRowByEmail_(sheet, email) {
  const normalizedEmail = normalizeEmail_(email);
  const rows = readRecords_(sheet);

  for (let i = 0; i < rows.length; i++) {
    if (
      normalizeEmail_(rows[i].record.email) ===
      normalizedEmail
    ) {
      return rows[i];
    }
  }

  return null;
}

function setCells_(sheet, row, updates) {
  Object.keys(updates).forEach(function (key) {
    const column = HEADERS.indexOf(key) + 1;

    if (column > 0) {
      sheet
        .getRange(row, column)
        .setValue(updates[key]);
    }
  });
}

// -----------------------------------------------------------------------------
// Settings sheet
// -----------------------------------------------------------------------------

function getSettingsSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(SETTINGS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SETTINGS_SHEET_NAME);
  }

  ensureSettingsSheet_(sheet);

  return sheet;
}

/**
 * Creates missing settings without overwriting existing values.
 *
 * This makes the initialization safe to run multiple times.
 */
function ensureSettingsSheet_(sheet) {
  const lastRow = sheet.getLastRow();

  if (lastRow === 0) {
    sheet
      .getRange(1, 1, 1, 3)
      .setValues([
        [
          'Setting',
          'Value',
          'Description',
        ],
      ]);
  }

  const existing = getExistingSettingKeys_(sheet);

  SETTINGS_DEFINITIONS.forEach(function (definition) {
    if (existing[definition.key]) {
      return;
    }

    sheet.appendRow([
      definition.key,
      definition.defaultValue,
      definition.description,
    ]);
  });

  formatSettingsSheet_(sheet);
}

/**
 * Reads the Settings sheet into:
 *
 * {
 *   registrationEnabled: true,
 *   maxRegistrations: 500,
 *   ...
 * }
 */
function getSettingsMap_() {
  const sheet = getSettingsSheet_();
  const lastRow = sheet.getLastRow();

  const settings = {};

  if (lastRow < 2) {
    return settings;
  }

  const values = sheet
    .getRange(2, 1, lastRow - 1, 2)
    .getValues();

  values.forEach(function (row) {
    const key = String(row[0] || '').trim();

    if (!key) {
      return;
    }

    settings[key] = row[1];
  });

  return settings;
}

function getExistingSettingKeys_(sheet) {
  const result = {};
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return result;
  }

  const values = sheet
    .getRange(2, 1, lastRow - 1, 1)
    .getValues();

  values.forEach(function (row) {
    const key = String(row[0] || '').trim();

    if (key) {
      result[key] = true;
    }
  });

  return result;
}

/**
 * Gives the Settings sheet a clean, usable baseline presentation.
 *
 * The more elaborate DETI+ dashboard styling comes in a later phase.
 */
function formatSettingsSheet_(sheet) {
  const lastRow = sheet.getLastRow();

  sheet.setFrozenRows(1);
  sheet.setHiddenGridlines(true);

  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 220);
  sheet.setColumnWidth(3, 520);

  const header = sheet.getRange(1, 1, 1, 3);

  header
    .setBackground('#111827')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle');

  sheet.setRowHeight(1, 36);

  if (lastRow < 2) {
    return;
  }

  const body = sheet.getRange(
    2,
    1,
    lastRow - 1,
    3
  );

  body
    .setVerticalAlignment('middle')
    .setWrap(true);

  sheet
    .getRange(2, 1, lastRow - 1, 1)
    .setFontWeight('bold');

  sheet
    .getRange(2, 3, lastRow - 1, 1)
    .setFontColor('#6b7280');

  applySettingsValidation_(sheet);
}

/**
 * Adds validation appropriate to each setting.
 */
function applySettingsValidation_(sheet) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return;
  }

  const keys = sheet
    .getRange(2, 1, lastRow - 1, 1)
    .getValues();

  keys.forEach(function (row, index) {
    const key = String(row[0] || '').trim();
    const sheetRow = index + 2;

    const definition = findSettingDefinition_(key);

    if (!definition) {
      return;
    }

    const valueCell = sheet.getRange(
      sheetRow,
      2
    );

    valueCell.clearDataValidations();

    if (definition.type === 'boolean') {
      valueCell.insertCheckboxes();
      return;
    }

    if (definition.type === 'number') {
      const validation = SpreadsheetApp
        .newDataValidation()
        .requireNumberGreaterThanOrEqualTo(0)
        .setAllowInvalid(false)
        .build();

      valueCell.setDataValidation(validation);

      valueCell.setNumberFormat('0');

      return;
    }

    if (definition.type === 'date') {
      valueCell.setNumberFormat(
        'dd/mm/yyyy hh:mm'
      );
    }
  });
}

function findSettingDefinition_(key) {
  for (
    let i = 0;
    i < SETTINGS_DEFINITIONS.length;
    i++
  ) {
    if (
      SETTINGS_DEFINITIONS[i].key === key
    ) {
      return SETTINGS_DEFINITIONS[i];
    }
  }

  return null;
}
