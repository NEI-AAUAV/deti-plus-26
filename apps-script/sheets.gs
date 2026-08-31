/**
 * DETI+ 2026 - Google Sheets storage and presentation.
 *
 * The backend continues to use stable canonical keys (registrationId, cvStatus,
 * etc.). The spreadsheet shows human-readable Portuguese labels instead.
 */

// -----------------------------------------------------------------------------
// Visual system
// -----------------------------------------------------------------------------

const DETI_LOGO_PNG_BASE64 = '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';

const DETI_SHEET_THEME = {
  black: '#050505',
  panel: '#111111',
  panelAlt: '#181818',
  border: '#2d2d2d',
  white: '#ffffff',
  muted: '#a3a3a3',
  accent: '#99ffff',
  accentSoft: '#e6ffff',
  green: '#dcfce7',
  greenText: '#166534',
  amber: '#fef3c7',
  amberText: '#92400e',
  red: '#fee2e2',
  redText: '#991b1b',
  blue: '#dbeafe',
  blueText: '#1e40af',
  body: '#ffffff',
  bodyAlt: '#fafafa',
  input: '#f7ffff',
  font: 'Montserrat',
};

const REGISTRATION_COLUMN_DEFINITIONS = [
  { key: 'registrationId', label: 'ID da inscrição', width: 130 },
  { key: 'registeredAt', label: 'Data de inscrição', width: 155, date: true },
  { key: 'token', label: 'Token', width: 260, technical: true },
  { key: 'name', label: 'Nome', width: 220 },
  { key: 'email', label: 'Email', width: 235 },
  { key: 'mobileNumber', label: 'Telemóvel', width: 145 },
  { key: 'course', label: 'Curso', width: 230 },
  { key: 'year', label: 'Ano', width: 95 },
  { key: 'registrationStatus', label: 'Estado da inscrição', width: 155 },
  { key: 'cvStatus', label: 'Estado do CV', width: 125 },
  { key: 'hasCvConsent', label: 'Partilha de CV', width: 125 },
  { key: 'hasGdprConsent', label: 'Consentimento RGPD', width: 150 },
  { key: 'cvFileId', label: 'ID do ficheiro CV', width: 260, technical: true },
  { key: 'cvName', label: 'Nome do CV', width: 230 },
  { key: 'cvSubmittedAt', label: 'CV enviado em', width: 155, date: true },
  { key: 'cvUpdatedAt', label: 'CV atualizado em', width: 155, date: true },
  { key: 'checkedIn', label: 'Check-in', width: 95 },
  { key: 'checkedInAt', label: 'Check-in em', width: 155, date: true },
  { key: 'cancelledAt', label: 'Cancelada em', width: 155, date: true },
  { key: 'notes', label: 'Notas internas', width: 320 },
  { key: 'timestamp', label: 'Data (legado)', width: 155, technical: true, date: true },
  { key: 'curse', label: 'Curso (legado)', width: 220, technical: true },
  { key: 'state', label: 'Estado (legado)', width: 140, technical: true },
];

const REGISTRATION_HEADER_ALIASES = (function () {
  const aliases = {};

  REGISTRATION_COLUMN_DEFINITIONS.forEach(function (definition) {
    aliases[normalizeHeaderLabel_(definition.key)] = definition.key;
    aliases[normalizeHeaderLabel_(definition.label)] = definition.key;
  });

  // Common historic/spreadsheet variants.
  [
    ['registration_id', 'registrationId'],
    ['registered_at', 'registeredAt'],
    ['mobile_number', 'mobileNumber'],
    ['registration_status', 'registrationStatus'],
    ['cv_status', 'cvStatus'],
    ['has_cv_consent', 'hasCvConsent'],
    ['has_gdpr_consent', 'hasGdprConsent'],
    ['cv_file_id', 'cvFileId'],
    ['cv_name', 'cvName'],
    ['cv_submitted_at', 'cvSubmittedAt'],
    ['cv_updated_at', 'cvUpdatedAt'],
    ['checked_in', 'checkedIn'],
    ['checked_in_at', 'checkedInAt'],
    ['cancelled_at', 'cancelledAt'],
  ].forEach(function (pair) {
    aliases[normalizeHeaderLabel_(pair[0])] = pair[1];
  });

  return aliases;
})();

function normalizeHeaderLabel_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_\-()]+/g, '');
}

function canonicalHeaderKey_(header) {
  const raw = String(header || '').trim();
  if (!raw) return '';

  return REGISTRATION_HEADER_ALIASES[normalizeHeaderLabel_(raw)] || raw;
}

function registrationDisplayLabel_(key) {
  for (let i = 0; i < REGISTRATION_COLUMN_DEFINITIONS.length; i++) {
    if (REGISTRATION_COLUMN_DEFINITIONS[i].key === key) {
      return REGISTRATION_COLUMN_DEFINITIONS[i].label;
    }
  }

  return key;
}

function styleDetiLogoCell_(range) {
  range
    .setBackground(DETI_SHEET_THEME.black)
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('left');

  const text = 'deti+';
  const baseStyle = SpreadsheetApp.newTextStyle()
    .setFontFamily(DETI_SHEET_THEME.font)
    .setFontSize(20)
    .setBold(true)
    .setForegroundColor(DETI_SHEET_THEME.white)
    .build();

  const accentStyle = SpreadsheetApp.newTextStyle()
    .setFontFamily(DETI_SHEET_THEME.font)
    .setFontSize(20)
    .setBold(true)
    .setForegroundColor(DETI_SHEET_THEME.accent)
    .build();

  const rich = SpreadsheetApp.newRichTextValue()
    .setText(text)
    .setTextStyle(0, 4, baseStyle)
    .setTextStyle(4, 5, accentStyle)
    .build();

  range.getCell(1, 1).setRichTextValue(rich);
}

function applyDetiSheetBase_(sheet, tabColor) {
  sheet.setHiddenGridlines(true);
  sheet.getDataRange().setFontFamily(DETI_SHEET_THEME.font);

  if (tabColor) {
    sheet.setTabColor(tabColor);
  }
}

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
  }

  ensureRegistrationColumns_(sheet);
  return sheet;
}

function ensureRegistrationColumns_(sheet) {
  if (sheet.getLastRow() === 0) {
    const labels = HEADERS.map(registrationDisplayLabel_);
    sheet.getRange(1, 1, 1, labels.length).setValues([labels]);
    return;
  }

  const map = getHeaderMap_(sheet);

  HEADERS.forEach(function (header) {
    if (map[header]) return;

    const column = Math.max(sheet.getLastColumn() + 1, 1);
    sheet.getRange(1, column).setValue(registrationDisplayLabel_(header));
    map[header] = column;
  });

  applyRegistrationDisplayHeaders_(sheet);
}

function applyRegistrationDisplayHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) return;

  const values = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const labels = values.map(function (value) {
    const key = canonicalHeaderKey_(value);
    return registrationDisplayLabel_(key);
  });

  sheet.getRange(1, 1, 1, lastColumn).setValues([labels]);
}

function getHeaderMap_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) return {};

  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const map = {};

  headers.forEach(function (value, index) {
    const key = canonicalHeaderKey_(value);
    if (!key) return;

    if (map[key]) {
      console.warn('Duplicate sheet header for canonical key: ' + key);
      return;
    }

    map[key] = index + 1;
  });

  return map;
}

function readRecords_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 2 || lastColumn < 1) return [];

  const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  const headers = values[0].map(canonicalHeaderKey_);
  const records = [];

  for (let i = 1; i < values.length; i++) {
    const record = {};

    headers.forEach(function (header, column) {
      if (!header) return;
      record[header] = values[i][column];
    });

    records.push({ row: i + 1, record: record });
  }

  return records;
}

function appendRegistration_(sheet, record) {
  ensureRegistrationColumns_(sheet);

  const lastColumn = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(canonicalHeaderKey_);

  const row = headers.map(function (header) {
    if (!header) return '';
    const value = record[header];
    return typeof value === 'undefined' ? '' : value;
  });

  sheet.appendRow(row);
  formatRegistrationRow_(sheet, sheet.getLastRow());
}

function findRowByToken_(sheet, token) {
  const normalizedToken = String(token || '').trim();
  if (!normalizedToken) return null;

  const rows = readRecords_(sheet);

  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i].record.token || '') === normalizedToken) return rows[i];
  }

  return null;
}

function findRowByEmail_(sheet, email) {
  const normalizedEmail = normalizeEmail_(email);
  const rows = readRecords_(sheet);

  for (let i = 0; i < rows.length; i++) {
    if (normalizeEmail_(rows[i].record.email) === normalizedEmail) return rows[i];
  }

  return null;
}

function findRowByRegistrationId_(sheet, registrationId) {
  const normalized = String(registrationId || '').trim().toUpperCase();
  if (!normalized) return null;

  const rows = readRecords_(sheet);

  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i].record.registrationId || '').trim().toUpperCase() === normalized) {
      return rows[i];
    }
  }

  return null;
}

function setCells_(sheet, row, updates) {
  const map = getHeaderMap_(sheet);

  const entries = Object.keys(updates)
    .map(function (key) {
      return { key: key, column: map[key], value: updates[key] };
    })
    .filter(function (entry) {
      if (!entry.column) {
        console.warn('Ignoring update for missing Registration column: ' + entry.key);
        return false;
      }
      return true;
    })
    .sort(function (a, b) { return a.column - b.column; });

  if (!entries.length) return;

  let group = [entries[0]];

  for (let i = 1; i < entries.length; i++) {
    const current = entries[i];
    const previous = group[group.length - 1];

    if (current.column === previous.column + 1) {
      group.push(current);
    } else {
      writeCellGroup_(sheet, row, group);
      group = [current];
    }
  }

  writeCellGroup_(sheet, row, group);

  if (sheet.getName() === SHEET_NAME && row >= 2) {
    formatRegistrationRow_(sheet, row);
  }
}

function writeCellGroup_(sheet, row, group) {
  if (!group.length) return;

  const firstColumn = group[0].column;
  sheet
    .getRange(row, firstColumn, 1, group.length)
    .setValues([group.map(function (entry) { return entry.value; })]);
}

function createNextRegistrationId_(sheet) {
  const rows = readRecords_(sheet);
  let highest = 0;

  rows.forEach(function (entry) {
    const id = String(entry.record.registrationId || '').trim().toUpperCase();
    if (id.indexOf(REGISTRATION_ID_PREFIX) !== 0) return;

    const suffix = id.substring(REGISTRATION_ID_PREFIX.length);
    const number = Number(suffix);

    if (Number.isFinite(number) && number > highest) highest = number;
  });

  return formatRegistrationId_(highest + 1);
}

// -----------------------------------------------------------------------------
// Registration presentation
// -----------------------------------------------------------------------------

function formatRegistrationSheet_(sheet) {
  ensureRegistrationColumns_(sheet);
  applyRegistrationDisplayHeaders_(sheet);
  applyDetiSheetBase_(sheet, DETI_SHEET_THEME.accent);

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  const map = getHeaderMap_(sheet);

  sheet.setFrozenRows(1);

  const header = sheet.getRange(1, 1, 1, lastColumn);
  header
    .setBackground(DETI_SHEET_THEME.black)
    .setFontColor(DETI_SHEET_THEME.white)
    .setFontWeight('bold')
    .setFontFamily(DETI_SHEET_THEME.font)
    .setFontSize(10)
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('left')
    .setWrap(true);

  sheet.setRowHeight(1, 46);

  REGISTRATION_COLUMN_DEFINITIONS.forEach(function (definition) {
    const column = map[definition.key];
    if (column) sheet.setColumnWidth(column, definition.width || 140);
  });

  if (lastRow >= 2) {
    const body = sheet.getRange(2, 1, lastRow - 1, lastColumn);
    body
      .setFontFamily(DETI_SHEET_THEME.font)
      .setFontSize(10)
      .setVerticalAlignment('middle')
      .setWrap(false);

    for (let row = 2; row <= lastRow; row++) {
      formatRegistrationRow_(sheet, row);
    }

    ensureCheckedInCheckboxes_(sheet, map, lastRow);
  }

  const existingFilter = sheet.getFilter();
  if (existingFilter) existingFilter.remove();

  if (lastRow >= 1 && lastColumn >= 1) {
    sheet.getRange(1, 1, Math.max(lastRow, 1), lastColumn).createFilter();
  }

  hideRegistrationTechnicalColumns_(sheet, map);
  placeRegistrationBrandMark_(sheet);
}

function formatRegistrationRow_(sheet, row) {
  if (row < 2) return;

  const map = getHeaderMap_(sheet);
  const lastColumn = sheet.getLastColumn();
  const rowRange = sheet.getRange(row, 1, 1, lastColumn);

  rowRange
    .setBackground(row % 2 === 0 ? DETI_SHEET_THEME.bodyAlt : DETI_SHEET_THEME.body)
    .setFontColor('#171717')
    .setFontFamily(DETI_SHEET_THEME.font)
    .setVerticalAlignment('middle');

  REGISTRATION_COLUMN_DEFINITIONS.forEach(function (definition) {
    const column = map[definition.key];
    if (!column || !definition.date) return;

    sheet.getRange(row, column).setNumberFormat('dd/mm/yyyy hh:mm');
  });

  if (map.registrationStatus) {
    const statusCell = sheet.getRange(row, map.registrationStatus);
    const status = String(statusCell.getValue() || '').trim().toLowerCase();

    if (status === 'confirmed') {
      statusCell.setBackground(DETI_SHEET_THEME.green).setFontColor(DETI_SHEET_THEME.greenText);
    } else if (status === 'waitlisted') {
      statusCell.setBackground(DETI_SHEET_THEME.amber).setFontColor(DETI_SHEET_THEME.amberText);
    } else if (status === 'cancelled') {
      statusCell.setBackground(DETI_SHEET_THEME.red).setFontColor(DETI_SHEET_THEME.redText);
    } else {
      statusCell.setBackground('#f3f4f6').setFontColor('#525252');
    }

    statusCell.setFontWeight('bold');
  }

  if (map.cvStatus) {
    const cvCell = sheet.getRange(row, map.cvStatus);
    const cvStatus = String(cvCell.getValue() || '').trim().toLowerCase();

    if (cvStatus === 'submitted' || cvStatus === 'updated') {
      cvCell.setBackground(DETI_SHEET_THEME.blue).setFontColor(DETI_SHEET_THEME.blueText);
    } else {
      cvCell.setBackground('#f3f4f6').setFontColor('#737373');
    }
  }
}

function ensureCheckedInCheckboxes_(sheet, map, lastRow) {
  const column = map.checkedIn;
  if (!column || lastRow < 2) return;

  sheet.getRange(2, column, lastRow - 1, 1).insertCheckboxes();
}

function hideRegistrationTechnicalColumns_(sheet, map) {
  ['token', 'cvFileId', 'timestamp', 'curse', 'state'].forEach(function (header) {
    const column = map[header];
    if (column) sheet.hideColumns(column);
  });
}

function placeRegistrationBrandMark_(sheet) {
  const logoColumn = sheet.getLastColumn() + 1;
  ensureSheetSize_(sheet, sheet.getMaxRows(), logoColumn + 2);

  // Over-grid image: it does not become part of the table/header schema.
  sheet.getImages().forEach(function (image) {
    try {
      if (image.getAltTextTitle() === 'DETI+ logo') image.remove();
    } catch (err) {
      // Ignore old images that do not expose alt text cleanly.
    }
  });

  const blob = Utilities.newBlob(
    Utilities.base64Decode(DETI_LOGO_PNG_BASE64),
    'image/png',
    'deti-plus-logo.png'
  );

  const image = sheet.insertImage(blob, logoColumn, 1);
  image
    .setAltTextTitle('DETI+ logo')
    .setAltTextDescription('DETI+ 2026')
    .setWidth(120)
    .setHeight(42);
}

// -----------------------------------------------------------------------------
// Settings sheet
// -----------------------------------------------------------------------------

function getSettingsSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(SETTINGS_SHEET_NAME);

  if (!sheet) sheet = ss.insertSheet(SETTINGS_SHEET_NAME);

  ensureSettingsSheet_(sheet);
  return sheet;
}

/**
 * Rebuilds the settings presentation without losing existing values.
 * Supports both the old "Setting | Value | Description" layout and the new
 * human-readable layout.
 */
function ensureSettingsSheet_(sheet) {
  const isNewLayout =
    sheet.getLastRow() >= 4 &&
    String(sheet.getRange(3, 2).getValue() || '').trim() === 'Definição' &&
    String(sheet.getRange(4, 5).getValue() || '').trim() !== '';

  if (!isNewLayout) {
    const existingValues = extractExistingSettingsValues_(sheet);

    sheet
      .getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns())
      .breakApart();
    sheet.clear();
    ensureSheetSize_(sheet, SETTINGS_DEFINITIONS.length + 5, 5);

    sheet.getRange('A1:D1').merge();
    styleDetiLogoCell_(sheet.getRange('A1:D1'));
    sheet.setRowHeight(1, 42);

    sheet.getRange('A2:D2')
      .merge()
      .setValue('Configuração do evento')
      .setBackground(DETI_SHEET_THEME.panel)
      .setFontColor(DETI_SHEET_THEME.white)
      .setFontFamily(DETI_SHEET_THEME.font)
      .setFontSize(14)
      .setFontWeight('bold');

    sheet.getRange(3, 1, 1, 4)
      .setValues([['Área', 'Definição', 'Valor', 'Ajuda']])
      .setBackground(DETI_SHEET_THEME.black)
      .setFontColor(DETI_SHEET_THEME.white)
      .setFontWeight('bold')
      .setFontFamily(DETI_SHEET_THEME.font);

    const rows = SETTINGS_DEFINITIONS.map(function (definition) {
      const value = Object.prototype.hasOwnProperty.call(existingValues, definition.key)
        ? existingValues[definition.key]
        : definition.defaultValue;

      return [
        definition.category,
        definition.label,
        value,
        definition.description,
        definition.key,
      ];
    });

    sheet.getRange(4, 1, rows.length, 5).setValues(rows);
  } else {
    // Keep values untouched; only refresh labels/help and append definitions
    // introduced by a newer script version.
    const lastRow = sheet.getLastRow();
    const keys = sheet.getRange(4, 5, lastRow - 3, 1).getValues();
    const keyRows = {};

    keys.forEach(function (row, index) {
      const key = String(row[0] || '').trim();
      if (key) keyRows[key] = index + 4;
    });

    SETTINGS_DEFINITIONS.forEach(function (definition) {
      let row = keyRows[definition.key];

      if (!row) {
        row = sheet.getLastRow() + 1;
        sheet.getRange(row, 1, 1, 5).setValues([[
          definition.category,
          definition.label,
          definition.defaultValue,
          definition.description,
          definition.key,
        ]]);
      } else {
        sheet.getRange(row, 1).setValue(definition.category);
        sheet.getRange(row, 2).setValue(definition.label);
        sheet.getRange(row, 4).setValue(definition.description);
      }
    });
  }

  formatSettingsSheet_(sheet);
}
function extractExistingSettingsValues_(sheet) {
  const result = {};
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 1 || lastColumn < 1) return result;

  const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  const header = values[0].map(function (value) { return String(value || '').trim(); });

  // Old format: Setting | Value | Description
  if (normalizeHeaderLabel_(header[0]) === normalizeHeaderLabel_('Setting')) {
    for (let i = 1; i < values.length; i++) {
      const key = String(values[i][0] || '').trim();
      if (key) result[key] = values[i][1];
    }
    return result;
  }

  // New format: hidden internal key in column E.
  for (let i = 0; i < values.length; i++) {
    const key = String(values[i][4] || '').trim();
    if (key) result[key] = values[i][2];
  }

  return result;
}

function getSettingsMap_() {
  const sheet = getSettingsSheet_();
  const settings = {};
  const lastRow = sheet.getLastRow();

  if (lastRow < 4) return settings;

  const values = sheet.getRange(4, 3, lastRow - 3, 3).getValues();

  values.forEach(function (row) {
    const value = row[0];
    const key = String(row[2] || '').trim();
    if (key) settings[key] = value;
  });

  return settings;
}

function getExistingSettingKeys_(sheet) {
  const map = getSettingsMap_();
  const result = {};

  Object.keys(map).forEach(function (key) {
    result[key] = true;
  });

  return result;
}

function formatSettingsSheet_(sheet) {
  applyDetiSheetBase_(sheet, DETI_SHEET_THEME.accent);

  const lastRow = sheet.getLastRow();

  sheet.setFrozenRows(3);
  sheet.setColumnWidth(1, 145);
  sheet.setColumnWidth(2, 240);
  sheet.setColumnWidth(3, 220);
  sheet.setColumnWidth(4, 520);
  sheet.setColumnWidth(5, 180);

  sheet.getRange(4, 1, Math.max(lastRow - 3, 1), 4)
    .setFontFamily(DETI_SHEET_THEME.font)
    .setVerticalAlignment('middle')
    .setWrap(true);

  if (lastRow >= 4) {
    sheet.getRange(4, 1, lastRow - 3, 1)
      .setFontWeight('bold')
      .setFontColor('#404040');

    sheet.getRange(4, 2, lastRow - 3, 1)
      .setFontWeight('bold')
      .setFontColor('#171717');

    sheet.getRange(4, 3, lastRow - 3, 1)
      .setBackground(DETI_SHEET_THEME.input)
      .setFontWeight('bold');

    sheet.getRange(4, 4, lastRow - 3, 1)
      .setFontColor('#737373');

    // Subtle category bands.
    const categories = sheet.getRange(4, 1, lastRow - 3, 1).getValues();
    let previous = '';

    categories.forEach(function (row, index) {
      const category = String(row[0] || '');
      const sheetRow = index + 4;

      if (category !== previous) {
        sheet.getRange(sheetRow, 1, 1, 4)
          .setBorder(true, false, false, false, false, false, DETI_SHEET_THEME.accent, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
      }

      previous = category;
    });
  }

  applySettingsValidation_(sheet);
  sheet.hideColumns(5);
}

function applySettingsValidation_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 4) return;

  const keys = sheet.getRange(4, 5, lastRow - 3, 1).getValues();

  keys.forEach(function (row, index) {
    const key = String(row[0] || '').trim();
    const sheetRow = index + 4;
    const definition = findSettingDefinition_(key);

    if (!definition) return;

    const valueCell = sheet.getRange(sheetRow, 3);
    valueCell.clearDataValidations();

    if (definition.type === 'boolean') {
      valueCell.insertCheckboxes();
      return;
    }

    if (definition.type === 'number') {
      const validation = SpreadsheetApp.newDataValidation()
        .requireNumberGreaterThanOrEqualTo(0)
        .setAllowInvalid(false)
        .setHelpText('Introduza 0 para "sem limite" ou um número inteiro positivo.')
        .build();

      valueCell.setDataValidation(validation).setNumberFormat('0');
      return;
    }

    if (definition.type === 'date') {
      valueCell.setNumberFormat('dd/mm/yyyy hh:mm');
      return;
    }

    if (definition.type === 'timezone' && definition.options) {
      const validation = SpreadsheetApp.newDataValidation()
        .requireValueInList(definition.options, true)
        .setAllowInvalid(false)
        .build();

      valueCell.setDataValidation(validation);
    }
  });
}

function findSettingDefinition_(key) {
  for (let i = 0; i < SETTINGS_DEFINITIONS.length; i++) {
    if (SETTINGS_DEFINITIONS[i].key === key) return SETTINGS_DEFINITIONS[i];
  }

  return null;
}

// -----------------------------------------------------------------------------
// Generic sheet helpers
// -----------------------------------------------------------------------------

function getOrCreateSheet_(name) {
  const ss = getSpreadsheet_();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function ensureSheetSize_(sheet, requiredRows, requiredColumns) {
  if (sheet.getMaxRows() < requiredRows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), requiredRows - sheet.getMaxRows());
  }

  if (sheet.getMaxColumns() < requiredColumns) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), requiredColumns - sheet.getMaxColumns());
  }
}
