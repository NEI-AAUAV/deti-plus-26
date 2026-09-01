/**
 * DETI+ 2026 - administration console.
 *
 * Full CRUD over registrations plus operational actions and participant
 * communication hooks for relevant registration-state transitions.
 */

const ADMIN_SHEET_NAME = 'Admin';
const ADMIN_SEARCH_CELL = 'B4';
const ADMIN_SEARCH_FIELD_CELL = 'B5';
const ADMIN_REGISTRATION_FILTER_CELL = 'B6';
const ADMIN_CV_FILTER_CELL = 'B7';
const ADMIN_CHECKIN_FILTER_CELL = 'B8';
const ADMIN_SELECTED_ID_CELL = 'B10';
const ADMIN_EDITOR_FIRST_ROW = 5;
const ADMIN_EDITOR_VALUE_COLUMN = 11; // K
const ADMIN_ACTION_CELL = 'K18';
const ADMIN_CONFIRM_CELL = 'K19';
const ADMIN_RESULT_CELL = 'J22';
const ADMIN_RESULTS_HEADER_ROW = 13;
const ADMIN_RESULTS_FIRST_ROW = 14;
const ADMIN_RESULTS_MAX = 50;

const ADMIN_SEARCH_FIELDS = [
  'Tudo',
  'ID',
  'Nome',
  'Email',
  'Telemóvel',
  'Curso',
  'Ano',
  'Estado',
  'Estado do CV',
  'Check-in',
];

const ADMIN_REGISTRATION_FILTER_OPTIONS = [
  'Todos',
  'Confirmados',
  'Lista de espera',
  'Cancelados',
];

const ADMIN_CV_FILTER_OPTIONS = [
  'Todos',
  'Com CV',
  'Sem CV',
  'Atualizado',
];

const ADMIN_CHECKIN_FILTER_OPTIONS = [
  'Todos',
  'Fez check-in',
  'Sem check-in',
];

const ADMIN_ACTION_LABELS = [
  'Criar inscrição',
  'Guardar alterações',
  'Reenviar magic link',
  'Cancelar inscrição',
  'Restaurar inscrição',
  'Promover da lista de espera',
  'Abrir CV',
  'Fazer check-in',
  'Anular check-in',
  'Eliminar participante',
];

const ADMIN_ACTION_MAP = {
  'Criar inscrição': 'CREATE_REGISTRATION',
  'Guardar alterações': 'SAVE_CHANGES',
  'Reenviar magic link': 'RESEND_MAGIC_LINK',
  'Cancelar inscrição': 'CANCEL_REGISTRATION',
  'Restaurar inscrição': 'RESTORE_REGISTRATION',
  'Promover da lista de espera': 'PROMOTE_WAITLIST',
  'Abrir CV': 'OPEN_CV',
  'Fazer check-in': 'CHECK_IN',
  'Anular check-in': 'UNDO_CHECK_IN',
  'Eliminar participante': 'DELETE_PARTICIPANT_DATA',
};

const ADMIN_EDITOR_FIELDS = [
  { key: 'registrationId', label: 'ID', editable: false },
  { key: 'name', label: 'Nome', editable: true },
  { key: 'email', label: 'Email', editable: true },
  { key: 'mobileNumber', label: 'Telemóvel', editable: true },
  { key: 'course', label: 'Curso', editable: true },
  { key: 'year', label: 'Ano', editable: true },
  { key: 'registrationStatus', label: 'Estado', editable: true },
  { key: 'cvStatus', label: 'Estado do CV', editable: false },
  { key: 'checkedIn', label: 'Check-in', editable: false },
  { key: 'registeredAt', label: 'Inscrito em', editable: false },
  { key: 'cvUpdatedAt', label: 'CV atualizado', editable: false },
  { key: 'notes', label: 'Notas internas', editable: true },
];

// -----------------------------------------------------------------------------
// Initialization / menu
// -----------------------------------------------------------------------------

function initializeOperations() {
  if (typeof migrateSystem === 'function') migrateSystem();

  const registrationSheet = ensureRegistrationSheetSchema_();
  getSettingsSheet_();
  getAuditSheet_();
  initializeAdminSheet_();
  formatRegistrationSheet_(registrationSheet);
  rebuildRegistrationCounters_();

  if (typeof refreshControlCenter_ === 'function') refreshControlCenter_();

  getEmailQueueSheet_();
  installOperationalTriggers();
  applyOperationalProtections();
  runHealthCheck();

  console.log('DETI+ operations initialized.');
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('DETI+')
    .addItem('Abrir / atualizar Admin', 'initializeAdminSheet_')
    .addItem('Atualizar dashboard', 'refreshControlCenter_')
    .addItem('Formatar inscrições', 'formatRegistrationSheetMenu_')
    .addItem('Criar ligações diretas para CVs', 'linkExistingCvFilesMenu_')
    .addItem('Formatar configurações', 'formatSettingsSheetMenu_')
    .addSeparator()
    .addItem('Executar migração', 'migrateSystem')
    .addItem('Verificar sistema', 'runHealthCheck')
    .addSeparator()
    .addItem('Promover próximo da lista de espera', 'promoteNextWaitlisted')
    .addSeparator()
    .addItem('Agendar comunicações', 'scheduleParticipantCommunications')
    .addItem('Enviar preview de email', 'sendParticipantEmailPreview')
    .addItem('Processar fila de emails', 'processEmailQueue')
    .addSeparator()
    .addItem('Exportar participantes', 'exportParticipantsCsv')
    .addItem('Exportar confirmados', 'exportConfirmedParticipantsCsv')
    .addItem('Exportar lista de espera', 'exportWaitlistCsv')
    .addItem('Exportar check-in', 'exportCheckInListCsv')
    .addItem('Exportar índice de CV', 'exportCvIndexCsv')
    .addSeparator()
    .addItem('Reaplicar permissões recomendadas', 'applyOperationalProtections')
    .addItem('Instalar triggers', 'installOperationalTriggers')
    .addItem('Executar retenção de dados', 'runDataRetention')
    .addItem('Repor alertas de lotação', 'resetCapacityNotifications')
    .addToUi();
}

function formatRegistrationSheetMenu_() {
  formatRegistrationSheet_(getSheet_());
}

function formatSettingsSheetMenu_() {
  formatSettingsSheet_(getSettingsSheet_());
}

function initializeAdminSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(ADMIN_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(ADMIN_SHEET_NAME);

  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).breakApart();
  sheet.clear();
  ensureSheetSize_(sheet, 70, 12);
  applyDetiSheetBase_(sheet, DETI_SHEET_THEME.accent);

  [150, 250, 110, 110, 110, 130, 130, 120, 30, 180, 260, 30].forEach(
    function (width, index) { sheet.setColumnWidth(index + 1, width); }
  );

  sheet.getRange('A1:H1').merge();
  styleDetiLogoCell_(sheet.getRange('A1:H1'));

  sheet
    .getRange('A2:H2')
    .merge()
    .setValue('Administração de inscrições')
    .setBackground(DETI_SHEET_THEME.panel)
    .setFontColor(DETI_SHEET_THEME.white)
    .setFontFamily(DETI_SHEET_THEME.font)
    .setFontWeight('bold')
    .setFontSize(15);

  sheet
    .getRange('A3:H3')
    .merge()
    .setValue('Pesquisa livre e filtros rápidos para gerir participantes sem escrever estados por extenso.')
    .setBackground(DETI_SHEET_THEME.panel)
    .setFontColor(DETI_SHEET_THEME.muted)
    .setFontFamily(DETI_SHEET_THEME.font);

  sheet.getRange('A4').setValue('Pesquisar').setFontWeight('bold');
  sheet
    .getRange(ADMIN_SEARCH_CELL)
    .setBackground(DETI_SHEET_THEME.input)
    .setNote('Exemplos: martim, 124833, conf, espera, sem cv, envi, 3º ou martim cv.');

  sheet.getRange('A5').setValue('Pesquisar em (opcional)').setFontWeight('bold');
  sheet
    .getRange(ADMIN_SEARCH_FIELD_CELL)
    .setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(ADMIN_SEARCH_FIELDS, true)
        .setAllowInvalid(false)
        .build()
    )
    .setValue('Tudo')
    .setBackground(DETI_SHEET_THEME.input);

  setAdminFilterDropdown_(sheet, 'A6', ADMIN_REGISTRATION_FILTER_CELL, 'Estado', ADMIN_REGISTRATION_FILTER_OPTIONS);
  setAdminFilterDropdown_(sheet, 'A7', ADMIN_CV_FILTER_CELL, 'CV', ADMIN_CV_FILTER_OPTIONS);
  setAdminFilterDropdown_(sheet, 'A8', ADMIN_CHECKIN_FILTER_CELL, 'Check-in', ADMIN_CHECKIN_FILTER_OPTIONS);

  sheet.getRange('A10').setValue('Participante selecionado').setFontWeight('bold');
  sheet
    .getRange(ADMIN_SELECTED_ID_CELL)
    .setBackground(DETI_SHEET_THEME.input)
    .setNote('Escolha um ID resultante da pesquisa ou introduza-o diretamente.');

  sheet
    .getRange('A12:H12')
    .merge()
    .setValue('Resultados')
    .setBackground(DETI_SHEET_THEME.panelAlt)
    .setFontColor(DETI_SHEET_THEME.white)
    .setFontWeight('bold');

  sheet
    .getRange(ADMIN_RESULTS_HEADER_ROW, 1, 1, 8)
    .setValues([['ID', 'Nome', 'Email', 'Curso', 'Ano', 'Estado', 'CV', 'Check-in']])
    .setBackground(DETI_SHEET_THEME.black)
    .setFontColor(DETI_SHEET_THEME.white)
    .setFontWeight('bold');

  sheet.getRange('J1:K1').merge();
  styleDetiLogoCell_(sheet.getRange('J1:K1'));

  sheet
    .getRange('J2:K2')
    .merge()
    .setValue('Ficha do participante')
    .setBackground(DETI_SHEET_THEME.panel)
    .setFontColor(DETI_SHEET_THEME.white)
    .setFontWeight('bold')
    .setFontSize(14);

  const labels = ADMIN_EDITOR_FIELDS.map(function (field) { return [field.label]; });
  sheet
    .getRange(ADMIN_EDITOR_FIRST_ROW, 10, labels.length, 1)
    .setValues(labels)
    .setFontWeight('bold')
    .setFontColor('#525252');

  sheet
    .getRange(ADMIN_EDITOR_FIRST_ROW, ADMIN_EDITOR_VALUE_COLUMN, labels.length, 1)
    .setBackground(DETI_SHEET_THEME.input);

  ADMIN_EDITOR_FIELDS.forEach(function (field, index) {
    const cell = sheet.getRange(ADMIN_EDITOR_FIRST_ROW + index, ADMIN_EDITOR_VALUE_COLUMN);
    if (!field.editable) cell.setBackground('#f3f4f6').setFontColor('#737373');
  });

  getAdminEditorCell_('registrationStatus').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['confirmed', 'waitlisted', 'cancelled'], true)
      .setAllowInvalid(false)
      .build()
  );

  getAdminEditorCell_('year').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(YEARS, true)
      .setAllowInvalid(true)
      .build()
  );

  sheet.getRange('J18').setValue('Ação').setFontWeight('bold');
  sheet
    .getRange(ADMIN_ACTION_CELL)
    .setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(ADMIN_ACTION_LABELS, true)
        .setAllowInvalid(false)
        .build()
    )
    .setBackground(DETI_SHEET_THEME.input);

  sheet.getRange('J19').setValue('Confirmar').setFontWeight('bold');
  sheet.getRange(ADMIN_CONFIRM_CELL).insertCheckboxes();

  sheet
    .getRange('J21:K21')
    .merge()
    .setValue('Resultado')
    .setBackground(DETI_SHEET_THEME.panelAlt)
    .setFontColor(DETI_SHEET_THEME.white)
    .setFontWeight('bold');

  sheet
    .getRange(ADMIN_RESULT_CELL + ':K24')
    .merge()
    .setWrap(true)
    .setVerticalAlignment('top');

  sheet
    .getRange('J26:K26')
    .merge()
    .setValue('Estado do sistema')
    .setBackground(DETI_SHEET_THEME.panelAlt)
    .setFontColor(DETI_SHEET_THEME.white)
    .setFontWeight('bold');

  sheet.setFrozenRows(3);
  refreshAdminSearch_();
  return sheet;
}

function setAdminFilterDropdown_(sheet, labelCell, valueCell, label, options) {
  sheet.getRange(labelCell).setValue(label).setFontWeight('bold');
  sheet.getRange(valueCell)
    .setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(options, true)
        .setAllowInvalid(false)
        .build()
    )
    .setValue('Todos')
    .setBackground(DETI_SHEET_THEME.input);
}

// -----------------------------------------------------------------------------
// Triggers
// -----------------------------------------------------------------------------

function ensureAdminEditTrigger_() { ensureSpreadsheetTrigger_('handleAdminEdit_'); }
function ensureRegistrationEditTrigger_() { ensureSpreadsheetTrigger_('handleRegistrationEdit_'); }
function ensureSettingsEditTrigger_() { ensureSpreadsheetTrigger_('handleSettingsEdit_'); }

function ensureSpreadsheetTrigger_(handler) {
  const ss = getSpreadsheet_();
  const exists = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === handler;
  });
  if (!exists) ScriptApp.newTrigger(handler).forSpreadsheet(ss).onEdit().create();
}

function handleAdminEdit_(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== ADMIN_SHEET_NAME) return;

  const a1 = e.range.getA1Notation();
  if ([
    ADMIN_SEARCH_CELL,
    ADMIN_SEARCH_FIELD_CELL,
    ADMIN_REGISTRATION_FILTER_CELL,
    ADMIN_CV_FILTER_CELL,
    ADMIN_CHECKIN_FILTER_CELL,
  ].indexOf(a1) !== -1) {
    refreshAdminSearch_();
    return;
  }
  if (a1 === ADMIN_SELECTED_ID_CELL) {
    loadAdminParticipantById_();
    return;
  }
  if (a1 !== ADMIN_CONFIRM_CELL || e.value !== 'TRUE') return;

  try {
    executeAdminAction_();
  } finally {
    sheet.getRange(ADMIN_CONFIRM_CELL).setValue(false);
  }
}

function handleSettingsEdit_(e) {
  if (!e || !e.range || e.range.getSheet().getName() !== SETTINGS_SHEET_NAME) return;
  invalidateEventConfigCache_();
  invalidateRegistrationStatusCache_();
}

function handleRegistrationEdit_(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== SHEET_NAME) return;

  const map = getHeaderMap_(sheet);
  const checkedInColumn = map.checkedIn;
  const notesColumn = map.notes;

  if (notesColumn && e.range.getColumn() === notesColumn) return;
  if (!checkedInColumn || e.range.getColumn() !== checkedInColumn || e.range.getRow() < 2) return;

  const rows = readRecords_(sheet);
  const entry = rows.find(function (item) { return item.row === e.range.getRow(); });
  if (!entry) return;

  const record = entry.record;
  const previousStatus = normalizedRegistrationStatus_(record);
  const wasCheckedIn = isRecordCheckedIn_(record);

  if (previousStatus === 'cancelled') {
    e.range.setValue(false);
    return;
  }

  const checked = e.value === 'TRUE';

  if (checked) {
    const now = new Date();
    setCells_(sheet, entry.row, {
      checkedIn: true,
      checkedInAt: now,
      registrationStatus: 'confirmed',
      state: legacyStateFor_('confirmed', normalizedCvStatus_(record)),
    });

    record.checkedIn = true;
    record.checkedInAt = now;
    record.registrationStatus = 'confirmed';
    record.state = legacyStateFor_('confirmed', normalizedCvStatus_(record));

    updateRegistrationCountersForTransition_(previousStatus, 'confirmed', wasCheckedIn, true);
    invalidateRegistrationStatusCache_();

    logAudit_(
      'PARTICIPANT_CHECKED_IN',
      record,
      previousStatus,
      'confirmed',
      'Participant checked in.',
      getAdminActor_()
    );
  } else {
    setCells_(sheet, entry.row, {
      checkedIn: false,
      checkedInAt: '',
      registrationStatus: 'confirmed',
      state: legacyStateFor_('confirmed', normalizedCvStatus_(record)),
    });

    record.checkedIn = false;
    record.checkedInAt = '';
    record.registrationStatus = 'confirmed';

    updateRegistrationCountersForTransition_(previousStatus, 'confirmed', wasCheckedIn, false);
    invalidateRegistrationStatusCache_();

    logAudit_(
      'PARTICIPANT_CHECKIN_REVERSED',
      record,
      previousStatus,
      'confirmed',
      'Participant check-in reversed.',
      getAdminActor_()
    );
  }

  if (typeof refreshControlCenter_ === 'function') refreshControlCenter_();
}

// -----------------------------------------------------------------------------
// Search / editor
// -----------------------------------------------------------------------------

function refreshAdminSearch_() {
  const admin = getOrCreateAdminSheet_();
  const query = String(admin.getRange(ADMIN_SEARCH_CELL).getValue() || '').trim();
  const field = String(admin.getRange(ADMIN_SEARCH_FIELD_CELL).getValue() || 'Tudo').trim();
  const matches = searchAdminParticipants_(query, field, {
    registration: String(admin.getRange(ADMIN_REGISTRATION_FILTER_CELL).getValue() || 'Todos').trim(),
    cv: String(admin.getRange(ADMIN_CV_FILTER_CELL).getValue() || 'Todos').trim(),
    checkin: String(admin.getRange(ADMIN_CHECKIN_FILTER_CELL).getValue() || 'Todos').trim(),
  });
  const outputRange = admin.getRange(ADMIN_RESULTS_FIRST_ROW, 1, ADMIN_RESULTS_MAX, 8);

  // Search results are rebuilt on every refresh. Remove old validations too:
  // otherwise checkboxes/dropdowns from a previous result can remain visible
  // in now-empty rows below the current result list.
  outputRange.clearContent().clearFormat().clearDataValidations();

  const values = matches.slice(0, ADMIN_RESULTS_MAX).map(function (entry) {
    const record = entry.record;
    return [
      record.registrationId || '',
      record.name || '',
      record.email || '',
      record.course || record.curse || '',
      record.year || '',
      normalizedRegistrationStatus_(record),
      normalizedCvStatus_(record),
      isRecordCheckedIn_(record) ? 'Sim' : 'Não',
    ];
  });

  if (values.length) {
    admin.getRange(ADMIN_RESULTS_FIRST_ROW, 1, values.length, 8).setValues(values);

    for (let index = 0; index < values.length; index++) {
      const row = ADMIN_RESULTS_FIRST_ROW + index;
      admin
        .getRange(row, 1, 1, 8)
        .setBackground(row % 2 === 0 ? DETI_SHEET_THEME.bodyAlt : DETI_SHEET_THEME.body)
        .setFontFamily(DETI_SHEET_THEME.font);
    }

    const ids = values.map(function (row) { return row[0]; }).filter(Boolean);
    if (ids.length) {
      admin.getRange(ADMIN_SELECTED_ID_CELL).setDataValidation(
        SpreadsheetApp.newDataValidation()
          .requireValueInList(ids, true)
          .setAllowInvalid(true)
          .build()
      );
    }
  }

  setAdminResult_(
    !query
      ? 'A mostrar as inscrições mais recentes. Use a pesquisa ou os filtros rápidos.'
      : values.length + ' resultado(s) encontrado(s).',
    false
  );

  return matches;
}

function searchAdminParticipants_(query, field, filters) {
  const rows = readRecords_(getSheet_());
  const terms = adminSearchTerms_(query);
  const selectedFilters = filters || {};

  const filtered = rows.filter(function (entry) {
    const values = adminSearchValues_(entry.record);
    if (!adminMatchesQuickFilters_(entry.record, selectedFilters)) return false;
    if (!terms.length) return true;

    const fields = field === 'Tudo'
      ? Object.keys(values)
      : [adminSearchFieldKey_(field)];

    return terms.every(function (term) {
      return fields.some(function (key) {
        return normalizeAdminSearchText_(values[key]).indexOf(term) !== -1;
      });
    });
  });

  return filtered.sort(function (a, b) {
    const ad = new Date(a.record.registeredAt || a.record.timestamp || 0).getTime() || 0;
    const bd = new Date(b.record.registeredAt || b.record.timestamp || 0).getTime() || 0;
    return bd - ad || b.row - a.row;
  });
}

function adminSearchValues_(record) {
  const registrationStatus = normalizedRegistrationStatus_(record);
  const cvStatus = normalizedCvStatus_(record);
  return {
    id: record.registrationId || '',
    name: record.name || '',
    email: record.email || '',
    mobile: record.mobileNumber || '',
    course: record.course || record.curse || '',
    year: String(record.year || '') + ' ano ano curricular',
    status: adminRegistrationSearchTerms_(registrationStatus),
    cv: adminCvSearchTerms_(cvStatus),
    checkin: isRecordCheckedIn_(record) ? 'sim yes true checked in' : 'não nao no false',
  };
}

function adminSearchTerms_(query) {
  return normalizeAdminSearchText_(query)
    .split(/[^a-z0-9@.+-]+/)
    .filter(function (term) { return term.length > 0; });
}

function adminRegistrationSearchTerms_(status) {
  const terms = {
    confirmed: 'confirmed confirmado confirmada confirmados confirmadas aceite aceite aprovada aprovado',
    waitlisted: 'waitlisted espera lista de espera em espera',
    cancelled: 'cancelled cancelado cancelada cancelados canceladas',
  };
  return terms[status] || status;
}

function adminCvSearchTerms_(status) {
  const terms = {
    none: 'none sem cv pendente por enviar nao enviado',
    submitted: 'submitted submetido submetida enviado enviada recebido recebida com cv',
    updated: 'updated atualizado atualizada substituido substituida reenviado reenviada com cv',
  };
  return terms[status] || status;
}

function adminMatchesQuickFilters_(record, filters) {
  const registration = String(filters.registration || 'Todos');
  const cv = String(filters.cv || 'Todos');
  const checkin = String(filters.checkin || 'Todos');
  const registrationStatus = normalizedRegistrationStatus_(record);
  const cvStatus = normalizedCvStatus_(record);
  const checkedIn = isRecordCheckedIn_(record);

  if (registration === 'Confirmados' && registrationStatus !== 'confirmed') return false;
  if (registration === 'Lista de espera' && registrationStatus !== 'waitlisted') return false;
  if (registration === 'Cancelados' && registrationStatus !== 'cancelled') return false;
  if (cv === 'Com CV' && (cvStatus !== 'submitted' && cvStatus !== 'updated')) return false;
  if (cv === 'Sem CV' && cvStatus !== 'none') return false;
  if (cv === 'Atualizado' && cvStatus !== 'updated') return false;
  if (checkin === 'Fez check-in' && !checkedIn) return false;
  if (checkin === 'Sem check-in' && checkedIn) return false;
  return true;
}

function adminSearchFieldKey_(field) {
  const map = {
    ID: 'id',
    Nome: 'name',
    Email: 'email',
    Telemóvel: 'mobile',
    Curso: 'course',
    Ano: 'year',
    Estado: 'status',
    'Estado do CV': 'cv',
    'Check-in': 'checkin',
  };
  return map[field] || 'email';
}

function normalizeAdminSearchText_(value) {
  return String(value == null ? '' : value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function loadAdminParticipantById_() {
  const admin = getOrCreateAdminSheet_();
  const id = String(admin.getRange(ADMIN_SELECTED_ID_CELL).getValue() || '').trim();
  clearAdminEditor_(admin);
  if (!id) return null;

  const found = findRowByRegistrationId_(getSheet_(), id);
  if (!found) {
    setAdminResult_('Participante não encontrado.', true);
    return null;
  }

  fillAdminEditor_(found.record);
  setAdminResult_('Participante carregado.', false);
  return found;
}

function loadAdminParticipant_() {
  const admin = getOrCreateAdminSheet_();
  const email = normalizeEmail_(admin.getRange(ADMIN_SEARCH_CELL).getValue());
  if (!email) return null;

  const found = findRowByEmail_(getSheet_(), email);
  if (!found) {
    setAdminResult_('Participante não encontrado.', true);
    return null;
  }

  admin.getRange(ADMIN_SELECTED_ID_CELL).setValue(found.record.registrationId || '');
  fillAdminEditor_(found.record);
  return found;
}

function fillAdminEditor_(record) {
  const admin = getOrCreateAdminSheet_();

  const values = ADMIN_EDITOR_FIELDS.map(function (field) {
    let value = record[field.key];
    if (field.key === 'registrationStatus') value = normalizedRegistrationStatus_(record);
    if (field.key === 'cvStatus') value = normalizedCvStatus_(record);
    if (field.key === 'checkedIn') value = isRecordCheckedIn_(record) ? 'Sim' : 'Não';
    if (field.key === 'course') value = record.course || record.curse || '';
    return [value == null ? '' : value];
  });

  admin
    .getRange(ADMIN_EDITOR_FIRST_ROW, ADMIN_EDITOR_VALUE_COLUMN, values.length, 1)
    .setValues(values);

  ['registeredAt', 'cvUpdatedAt'].forEach(function (key) {
    getAdminEditorCell_(key).setNumberFormat('dd/mm/yyyy hh:mm');
  });
}

function clearAdminEditor_(sheet) {
  (sheet || getOrCreateAdminSheet_())
    .getRange(ADMIN_EDITOR_FIRST_ROW, ADMIN_EDITOR_VALUE_COLUMN, ADMIN_EDITOR_FIELDS.length, 1)
    .clearContent();
}

function getAdminEditorCell_(key) {
  for (let i = 0; i < ADMIN_EDITOR_FIELDS.length; i++) {
    if (ADMIN_EDITOR_FIELDS[i].key === key) {
      return getOrCreateAdminSheet_().getRange(
        ADMIN_EDITOR_FIRST_ROW + i,
        ADMIN_EDITOR_VALUE_COLUMN
      );
    }
  }
  throw new Error('Unknown admin editor field: ' + key);
}

function getAdminEditorValues_() {
  const admin = getOrCreateAdminSheet_();
  const values = admin
    .getRange(ADMIN_EDITOR_FIRST_ROW, ADMIN_EDITOR_VALUE_COLUMN, ADMIN_EDITOR_FIELDS.length, 1)
    .getValues();

  const result = {};
  ADMIN_EDITOR_FIELDS.forEach(function (field, index) {
    result[field.key] = values[index][0];
  });
  return result;
}

function getOrCreateAdminSheet_() {
  const ss = getSpreadsheet_();
  return ss.getSheetByName(ADMIN_SHEET_NAME) || initializeAdminSheet_();
}

// -----------------------------------------------------------------------------
// CRUD dispatcher
// -----------------------------------------------------------------------------

function executeAdminAction_() {
  const admin = getOrCreateAdminSheet_();
  const label = String(admin.getRange(ADMIN_ACTION_CELL).getValue() || '').trim();
  const action = ADMIN_ACTION_MAP[label];

  if (!action) {
    setAdminResult_('Escolha uma ação válida.', true);
    return;
  }

  const selectedId = String(admin.getRange(ADMIN_SELECTED_ID_CELL).getValue() || '').trim();
  let result;

  switch (action) {
    case 'CREATE_REGISTRATION':
      result = adminCreateRegistration_();
      break;
    case 'SAVE_CHANGES':
      result = adminSaveRegistration_(selectedId);
      break;
    default: {
      if (!selectedId) {
        setAdminResult_('Selecione primeiro um participante.', true);
        return;
      }

      const found = findRowByRegistrationId_(getSheet_(), selectedId);
      if (!found) {
        setAdminResult_('Participante não encontrado.', true);
        return;
      }
      result = executeExistingParticipantAction_(action, found.record.email);
    }
  }

  setAdminResult_(result.message, !result.ok);
  refreshAdminSearch_();

  if (result.ok && action === 'CREATE_REGISTRATION' && result.registrationId) {
    admin.getRange(ADMIN_SELECTED_ID_CELL).setValue(result.registrationId);
    loadAdminParticipantById_();
  } else if (result.ok && action === 'DELETE_PARTICIPANT_DATA') {
    admin.getRange(ADMIN_SELECTED_ID_CELL).clearContent();
    clearAdminEditor_(admin);
  } else if (selectedId) {
    admin.getRange(ADMIN_SELECTED_ID_CELL).setValue(selectedId);
    loadAdminParticipantById_();
  }

  if (typeof refreshControlCenter_ === 'function') refreshControlCenter_();
}

function executeExistingParticipantAction_(action, email) {
  switch (action) {
    case 'RESEND_MAGIC_LINK': return adminResendMagicLink_(email);
    case 'CANCEL_REGISTRATION': return adminCancelRegistration_(email);
    case 'RESTORE_REGISTRATION': return adminRestoreRegistration_(email);
    case 'PROMOTE_WAITLIST': return adminPromoteWaitlist_(email);
    case 'OPEN_CV': return adminOpenCv_(email);
    case 'CHECK_IN': return adminCheckIn_(email);
    case 'UNDO_CHECK_IN': return adminUndoCheckIn_(email);
    case 'DELETE_PARTICIPANT_DATA': return adminDeleteParticipantData_(email);
    default: return adminError_('Ação não suportada.');
  }
}

/**
 * Opens an administrator-only link to the selected participant's private CV.
 * The Drive file remains private: the link inherits the owner's Drive
 * permissions and is never returned by the public participant API.
 */
function adminOpenCv_(email) {
  const found = findRowByEmail_(getSheet_(), email);
  if (!found) return adminError_('Participante não encontrado.');
  if (!found.record.cvFileId) return adminError_('Este participante ainda não enviou CV.');

  let file;
  try {
    file = DriveApp.getFileById(String(found.record.cvFileId));
  } catch (err) {
    console.warn('Could not open CV: ' + err);
    return adminError_('Não foi possível aceder ao ficheiro de CV associado.');
  }

  const url = file.getUrl();
  const name = String(found.record.name || 'participante');
  const output = HtmlService.createHtmlOutput(
    '<!doctype html><html><head><base target="_blank"></head><body style="font-family:Arial,sans-serif;padding:16px">' +
      '<p>A abrir o CV de <strong>' + escapeAdminHtml_(name) + '</strong>…</p>' +
      '<p><a href="' + escapeAdminHtml_(url) + '" target="_blank" rel="noopener">Abrir CV</a></p>' +
      '<script>window.open(' + JSON.stringify(url) + ', "_blank");google.script.host.close();</script>' +
      '</body></html>'
  ).setWidth(320).setHeight(130);

  SpreadsheetApp.getUi().showModalDialog(output, 'Abrir CV');
  return adminSuccess_('A abrir o CV de ' + name + '.');
}

function escapeAdminHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// -----------------------------------------------------------------------------
// Create / Update
// -----------------------------------------------------------------------------

function adminCreateRegistration_() {
  return withAdminLock_(function () {
    const sheet = getSheet_();
    const editor = getAdminEditorValues_();

    const name = String(editor.name || '').trim();
    const email = normalizeEmail_(editor.email);
    const mobileNumber = String(editor.mobileNumber || '').trim();
    const course = String(editor.course || '').trim();
    const year = String(editor.year || '').trim();
    const notes = String(editor.notes || '').trim();
    const requestedStatus = String(editor.registrationStatus || 'confirmed').trim().toLowerCase();

    if (!name || !email || !course || !year) {
      return adminError_('Preencha Nome, Email, Curso e Ano antes de criar a inscrição.');
    }
    if (findRowByEmail_(sheet, email)) {
      return adminError_('Já existe uma inscrição com este email.');
    }

    const status = ['confirmed', 'waitlisted', 'cancelled'].indexOf(requestedStatus) !== -1
      ? requestedStatus
      : 'confirmed';

    if (status === 'confirmed') {
      const config = getEventConfig_();
      const counts = getRegistrationCounters_({ lockHeld: true });
      if (config.maxRegistrations > 0 && counts.registered >= config.maxRegistrations) {
        return adminError_('A lotação está cheia. Crie a inscrição como waitlisted ou liberte uma vaga.');
      }
    }

    const now = new Date();
    const registrationId = createNextRegistrationId_(sheet);
    const record = {
      registrationId: registrationId,
      registeredAt: now,
      token: Utilities.getUuid(),
      name: name,
      email: email,
      mobileNumber: mobileNumber,
      course: course,
      year: year,
      registrationStatus: status,
      cvStatus: 'none',
      hasCvConsent: false,
      hasGdprConsent: true,
      cvFileId: '',
      cvName: '',
      cvSubmittedAt: '',
      cvUpdatedAt: '',
      checkedIn: false,
      checkedInAt: '',
      cancelledAt: status === 'cancelled' ? now : '',
      notes: notes,
      timestamp: now,
      curse: course,
      state: legacyStateFor_(status, 'none'),
    };

    appendRegistration_(sheet, record);
    updateRegistrationCountersForTransition_('', status, false, false, { lockHeld: true });
    invalidateRegistrationStatusCache_();

    logAudit_(
      'REGISTRATION_CREATED',
      record,
      '',
      status,
      'Registration manually created by administrator.',
      getAdminActor_()
    );

    if (status !== 'cancelled') {
      sendMagicLink_(record, {
        returning: false,
        registrationStatus: status,
        cvUploaded: false,
      });
    }

    return {
      ok: true,
      message: 'Inscrição criada com sucesso.',
      registrationId: registrationId,
    };
  });
}

function adminSaveRegistration_(registrationId) {
  if (!registrationId) return adminError_('Selecione primeiro um participante.');

  return withAdminLock_(function () {
    const sheet = getSheet_();
    const found = findRowByRegistrationId_(sheet, registrationId);
    if (!found) return adminError_('Participante não encontrado.');

    const editor = getAdminEditorValues_();
    const current = found.record;
    const previousEmail = normalizeEmail_(current.email);
    const nextEmail = normalizeEmail_(editor.email);

    if (!String(editor.name || '').trim() || !nextEmail) {
      return adminError_('Nome e Email são obrigatórios.');
    }

    if (nextEmail !== previousEmail) {
      const duplicate = findRowByEmail_(sheet, nextEmail);
      if (duplicate && duplicate.row !== found.row) {
        return adminError_('Já existe outra inscrição com esse email.');
      }
    }

    const previousStatus = normalizedRegistrationStatus_(current);
    const nextStatus = String(editor.registrationStatus || previousStatus).trim().toLowerCase();

    if (['confirmed', 'waitlisted', 'cancelled'].indexOf(nextStatus) === -1) {
      return adminError_('Estado inválido.');
    }

    if (previousStatus !== 'confirmed' && nextStatus === 'confirmed') {
      const config = getEventConfig_();
      const counts = getRegistrationCounters_({ lockHeld: true });
      if (config.maxRegistrations > 0 && counts.registered >= config.maxRegistrations) {
        return adminError_('Não existe uma vaga confirmada disponível.');
      }
    }

    const course = String(editor.course || '').trim();
    const updates = {
      name: String(editor.name || '').trim(),
      email: nextEmail,
      mobileNumber: String(editor.mobileNumber || '').trim(),
      course: course,
      curse: course,
      year: String(editor.year || '').trim(),
      registrationStatus: nextStatus,
      cancelledAt: nextStatus === 'cancelled' ? (current.cancelledAt || new Date()) : '',
      checkedIn: nextStatus === 'cancelled' ? false : current.checkedIn,
      checkedInAt: nextStatus === 'cancelled' ? '' : current.checkedInAt,
      notes: String(editor.notes || '').trim(),
      state: legacyStateFor_(nextStatus, normalizedCvStatus_(current)),
    };

    setCells_(sheet, found.row, updates);
    updateRegistrationCountersForTransition_(
      previousStatus,
      nextStatus,
      isRecordCheckedIn_(current),
      nextStatus === 'cancelled' ? false : isRecordCheckedIn_(current),
      { lockHeld: true }
    );
    invalidateRegistrationStatusCache_();

    const auditRecord = Object.assign({}, current, updates);

    logAudit_(
      'REGISTRATION_UPDATED',
      auditRecord,
      previousStatus,
      nextStatus,
      'Participant data updated by administrator.',
      getAdminActor_()
    );

    if (previousStatus !== nextStatus) {
      if (nextStatus === 'cancelled') {
        sendCancellationEmail_(auditRecord);
      } else if (previousStatus === 'cancelled') {
        sendRestorationEmail_(auditRecord, nextStatus);
      } else if (previousStatus === 'waitlisted' && nextStatus === 'confirmed') {
        sendPromotionEmail_(auditRecord);
      } else if (previousStatus === 'confirmed' && nextStatus === 'waitlisted') {
        sendMovedToWaitlistEmail_(auditRecord);
      }
    }

    if (previousStatus === 'confirmed' && nextStatus === 'cancelled') {
      promoteNextWaitlistedUnlocked_(sheet, 'Place released by administrative update.');
    }

    checkCapacityNotifications_();
    return adminSuccess_('Alterações guardadas.');
  });
}

// -----------------------------------------------------------------------------
// Existing operational actions
// -----------------------------------------------------------------------------

function adminResendMagicLink_(email) {
  const found = findRowByEmail_(getSheet_(), email);
  if (!found) return adminError_('Participante não encontrado.');

  const status = normalizedRegistrationStatus_(found.record);
  if (status === 'cancelled') {
    return adminError_('Inscrições canceladas não recebem magic links.');
  }

  sendMagicLink_(found.record, { returning: true, registrationStatus: status });

  logAudit_(
    'MAGIC_LINK_RESENT',
    found.record,
    status,
    status,
    'Magic link resent by administrator.',
    getAdminActor_()
  );
  return adminSuccess_('Magic link enviado.');
}

function adminCancelRegistration_(email) {
  return withAdminLock_(function () {
    const sheet = getSheet_();
    const found = findRowByEmail_(sheet, email);
    if (!found) return adminError_('Participante não encontrado.');

    const previousStatus = normalizedRegistrationStatus_(found.record);
    if (previousStatus === 'cancelled') return adminError_('A inscrição já está cancelada.');

    const wasCheckedIn = isRecordCheckedIn_(found.record);
    const now = new Date();

    setCells_(sheet, found.row, {
      registrationStatus: 'cancelled',
      cancelledAt: now,
      checkedIn: false,
      checkedInAt: '',
      state: 'cancelled',
    });

    found.record.registrationStatus = 'cancelled';
    found.record.cancelledAt = now;
    found.record.checkedIn = false;
    found.record.checkedInAt = '';
    found.record.state = 'cancelled';

    updateRegistrationCountersForTransition_(
      previousStatus,
      'cancelled',
      wasCheckedIn,
      false,
      { lockHeld: true }
    );
    invalidateRegistrationStatusCache_();

    logAudit_(
      'REGISTRATION_CANCELLED',
      found.record,
      previousStatus,
      'cancelled',
      'Registration cancelled by administrator.',
      getAdminActor_()
    );

    sendCancellationEmail_(found.record);

    if (previousStatus === 'confirmed') {
      promoteNextWaitlistedUnlocked_(sheet, 'Place released by cancellation.');
    }

    checkCapacityNotifications_();
    return adminSuccess_('Inscrição cancelada.');
  });
}

function adminRestoreRegistration_(email) {
  return withAdminLock_(function () {
    const sheet = getSheet_();
    const found = findRowByEmail_(sheet, email);
    if (!found) return adminError_('Participante não encontrado.');

    const previousStatus = normalizedRegistrationStatus_(found.record);
    if (previousStatus !== 'cancelled') {
      return adminError_('Só inscrições canceladas podem ser restauradas.');
    }

    const config = getEventConfig_();
    const counts = getRegistrationCounters_({ lockHeld: true });
    const nextStatus =
      config.maxRegistrations === 0 || counts.registered < config.maxRegistrations
        ? 'confirmed'
        : config.waitlistEnabled &&
            (config.maxWaitlist === 0 || counts.waitlisted < config.maxWaitlist)
          ? 'waitlisted'
          : '';

    if (!nextStatus) {
      return adminError_('Não existe vaga confirmada nem lugar disponível na lista de espera.');
    }

    const cvStatus = normalizedCvStatus_(found.record);
    setCells_(sheet, found.row, {
      registrationStatus: nextStatus,
      cancelledAt: '',
      checkedIn: false,
      checkedInAt: '',
      state: legacyStateFor_(nextStatus, cvStatus),
    });

    found.record.registrationStatus = nextStatus;
    found.record.cancelledAt = '';
    found.record.checkedIn = false;
    found.record.checkedInAt = '';
    found.record.state = legacyStateFor_(nextStatus, cvStatus);

    updateRegistrationCountersForTransition_(
      'cancelled',
      nextStatus,
      false,
      false,
      { lockHeld: true }
    );
    invalidateRegistrationStatusCache_();

    sendRestorationEmail_(found.record, nextStatus);

    logAudit_(
      'REGISTRATION_RESTORED',
      found.record,
      previousStatus,
      nextStatus,
      'Cancelled registration restored.',
      getAdminActor_()
    );

    if (nextStatus === 'confirmed') checkCapacityNotifications_();

    return adminSuccess_(
      nextStatus === 'waitlisted'
        ? 'Inscrição restaurada para a lista de espera.'
        : 'Inscrição restaurada e confirmada.'
    );
  });
}

function adminPromoteWaitlist_(email) {
  return withAdminLock_(function () {
    const sheet = getSheet_();
    const found = findRowByEmail_(sheet, email);
    if (!found) return adminError_('Participante não encontrado.');

    const previousStatus = normalizedRegistrationStatus_(found.record);
    if (previousStatus !== 'waitlisted') {
      return adminError_('O participante não está na lista de espera.');
    }

    const config = getEventConfig_();
    const counts = getRegistrationCounters_({ lockHeld: true });
    if (config.maxRegistrations > 0 && counts.registered >= config.maxRegistrations) {
      return adminError_('Não existe atualmente uma vaga confirmada.');
    }

    const cvStatus = normalizedCvStatus_(found.record);
    setCells_(sheet, found.row, {
      registrationStatus: 'confirmed',
      state: legacyStateFor_('confirmed', cvStatus),
    });

    found.record.registrationStatus = 'confirmed';
    found.record.state = legacyStateFor_('confirmed', cvStatus);

    updateRegistrationCountersForTransition_(
      'waitlisted',
      'confirmed',
      false,
      false,
      { lockHeld: true }
    );
    invalidateRegistrationStatusCache_();

    sendPromotionEmail_(found.record);

    logAudit_(
      'REGISTRATION_PROMOTED',
      found.record,
      previousStatus,
      'confirmed',
      'Participant promoted from waiting list.',
      getAdminActor_()
    );

    return adminSuccess_('Participante promovido e email de confirmação enviado.');
  });
}

function adminCheckIn_(email) {
  return withAdminLock_(function () {
    const sheet = getSheet_();
    const found = findRowByEmail_(sheet, email);
    if (!found) return adminError_('Participante não encontrado.');

    const previousStatus = normalizedRegistrationStatus_(found.record);
    if (previousStatus === 'cancelled') {
      return adminError_('Inscrições canceladas não podem fazer check-in.');
    }
    if (previousStatus === 'waitlisted') {
      return adminError_('Participantes em lista de espera têm de ser promovidos antes do check-in.');
    }
    if (isRecordCheckedIn_(found.record)) {
      return adminError_('O participante já fez check-in.');
    }

    const now = new Date();
    setCells_(sheet, found.row, {
      checkedIn: true,
      checkedInAt: now,
      registrationStatus: 'confirmed',
      state: legacyStateFor_('confirmed', normalizedCvStatus_(found.record)),
    });

    found.record.registrationStatus = 'confirmed';
    found.record.checkedIn = true;
    found.record.checkedInAt = now;

    updateRegistrationCountersForTransition_(previousStatus, 'confirmed', false, true, { lockHeld: true });
    invalidateRegistrationStatusCache_();

    logAudit_(
      'PARTICIPANT_CHECKED_IN',
      found.record,
      previousStatus,
      'confirmed',
      'Participant checked in.',
      getAdminActor_()
    );

    return adminSuccess_('Check-in efetuado.');
  });
}

function adminUndoCheckIn_(email) {
  return withAdminLock_(function () {
    const sheet = getSheet_();
    const found = findRowByEmail_(sheet, email);
    if (!found) return adminError_('Participante não encontrado.');
    if (!isRecordCheckedIn_(found.record)) return adminError_('O participante não fez check-in.');

    const cvStatus = normalizedCvStatus_(found.record);
    setCells_(sheet, found.row, {
      checkedIn: false,
      checkedInAt: '',
      registrationStatus: 'confirmed',
      state: legacyStateFor_('confirmed', cvStatus),
    });

    found.record.registrationStatus = 'confirmed';
    found.record.checkedIn = false;
    found.record.checkedInAt = '';

    updateRegistrationCountersForTransition_('confirmed', 'confirmed', true, false, { lockHeld: true });
    invalidateRegistrationStatusCache_();

    logAudit_(
      'PARTICIPANT_CHECKIN_REVERSED',
      found.record,
      'confirmed',
      'confirmed',
      'Participant check-in reversed.',
      getAdminActor_()
    );

    return adminSuccess_('Check-in anulado.');
  });
}

function adminDeleteParticipantData_(email) {
  return withAdminLock_(function () {
    const sheet = getSheet_();
    const found = findRowByEmail_(sheet, email);
    if (!found) return adminError_('Participante não encontrado.');

    const record = found.record;
    const previousStatus = normalizedRegistrationStatus_(record);
    const wasConfirmed = previousStatus === 'confirmed';
    const wasCheckedIn = isRecordCheckedIn_(record);
    const auditRecord = {
      registrationId: record.registrationId || '',
      email: record.email || '',
    };

    if (record.cvFileId) {
      try {
        DriveApp.getFileById(record.cvFileId).setTrashed(true);
      } catch (err) {
        console.warn('Could not trash participant CV during GDPR deletion: ' + err);
      }
    }

    logAudit_(
      'PARTICIPANT_DELETED',
      auditRecord,
      normalizedRegistrationStatus_(record),
      'deleted',
      'Participant personal data permanently removed.',
      getAdminActor_()
    );

    sheet.deleteRow(found.row);
    updateRegistrationCountersForTransition_(
      previousStatus,
      '',
      wasCheckedIn,
      false,
      { lockHeld: true }
    );
    invalidateRegistrationStatusCache_();

    if (wasConfirmed) {
      promoteNextWaitlistedUnlocked_(sheet, 'Place released by GDPR deletion.');
    }

    return adminSuccess_('Participante eliminado definitivamente.');
  });
}

// -----------------------------------------------------------------------------
// Health
// -----------------------------------------------------------------------------

function runHealthCheck() {
  const admin = getOrCreateAdminSheet_();
  const results = [];

  ['SHEET_ID', 'CV_FOLDER_ID', 'SITE_URL', 'EVENT_EMAIL'].forEach(function (key) {
    checkProperty_(results, key);
  });

  try {
    const sheet = getSheet_();
    const map = getHeaderMap_(sheet);
    const missing = HEADERS.filter(function (header) { return !map[header]; });
    results.push([
      missing.length === 0 ? '✓' : '✗',
      missing.length === 0 ? 'Estrutura de inscrições' : 'Em falta: ' + missing.join(', '),
    ]);
  } catch (err) {
    results.push(['✗', 'Folha de inscrições']);
  }

  try {
    getSettingsSheet_();
    results.push(['✓', 'Configurações']);
  } catch (err) {
    results.push(['✗', 'Configurações']);
  }

  try {
    const queue = getEmailQueueSheet_();
    const map = getHeaderMap_(queue);
    const missingQueue = EMAIL_QUEUE_HEADERS.filter(function (header) { return !map[header]; });
    results.push([
      missingQueue.length === 0 ? '✓' : '✗',
      missingQueue.length === 0 ? 'Fila de emails' : 'Email Queue em falta: ' + missingQueue.join(', '),
    ]);
  } catch (err) {
    results.push(['✗', 'Fila de emails']);
  }

  try {
    getAuditSheet_();
    results.push(['✓', 'Registo de auditoria']);
  } catch (err) {
    results.push(['✗', 'Registo de auditoria']);
  }

  try {
    DriveApp.getFolderById(prop_('CV_FOLDER_ID')).getName();
    results.push(['✓', 'Pasta de CV']);
  } catch (err) {
    results.push(['✗', 'Pasta de CV']);
  }

  try {
    const version = typeof getSchemaVersion_ === 'function' ? getSchemaVersion_() : 0;
    results.push([
      version === CURRENT_SCHEMA_VERSION ? '✓' : '⚠',
      'Schema v' + version + '/' + CURRENT_SCHEMA_VERSION,
    ]);
  } catch (err) {
    results.push(['✗', 'Versão do schema']);
  }

  admin.getRange('J27:K40').clearContent();
  if (results.length) admin.getRange(27, 10, results.length, 2).setValues(results);
  return results;
}

function checkProperty_(results, key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  results.push([value ? '✓' : '✗', key]);
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function withAdminLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function adminSuccess_(message) { return { ok: true, message: message }; }
function adminError_(message) { return { ok: false, message: message }; }

function setAdminResult_(message, error) {
  const range = getOrCreateAdminSheet_().getRange(ADMIN_RESULT_CELL + ':K24');
  range
    .setValue(message)
    .setBackground(error ? DETI_SHEET_THEME.red : DETI_SHEET_THEME.accentSoft)
    .setFontColor(error ? DETI_SHEET_THEME.redText : '#155e75')
    .setFontWeight('bold')
    .setFontFamily(DETI_SHEET_THEME.font);
}
