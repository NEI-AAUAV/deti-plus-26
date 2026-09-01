/**
 * DETI+ 2026 - event configuration
 *
 * Public/event configuration is stored in the "Settings" sheet.
 * Technical secrets and infrastructure identifiers remain in Script Properties.
 */

const SETTINGS_SHEET_NAME = 'Settings';
const DEFAULT_EVENT_TIMEZONE = 'Europe/Lisbon';
const REGISTRATION_STATUS_CACHE_KEY = 'registration_status_v1';
const REGISTRATION_STATUS_CACHE_TTL_SECONDS = 30;
const EVENT_CONFIG_CACHE_KEY = 'event_config_v2';
const EVENT_CONFIG_CACHE_TTL_SECONDS = 300;
const REGISTRATION_COUNTERS_PROPERTY_KEY = 'registration_counters_v1';
const REGISTRATION_COUNTERS_LOCK_TIMEOUT_MS = 5000;

const SETTINGS_DEFINITIONS = [
  {
    key: 'eventName',
    label: 'Nome do evento',
    category: 'Evento',
    defaultValue: 'DETI+ 2026',
    description: 'Nome apresentado publicamente no site e nas comunicações.',
    type: 'text',
  },
  {
    key: 'timezone',
    label: 'Fuso horário',
    category: 'Evento',
    defaultValue: DEFAULT_EVENT_TIMEZONE,
    description: 'Fuso horário usado em datas e horas. Recomenda-se Europe/Lisbon.',
    type: 'timezone',
    options: ['Europe/Lisbon', 'UTC'],
  },
  {
    key: 'eventStartsAt',
    label: 'Início do evento',
    category: 'Evento',
    defaultValue: '2026-05-19T09:00:00',
    description: 'Data e hora de início do DETI+ usada nos lembretes aos participantes.',
    type: 'date',
  },
  {
    key: 'eventEndsAt',
    label: 'Fim do evento',
    category: 'Evento',
    defaultValue: '2026-05-21T20:00:00',
    description: 'Data e hora de encerramento do DETI+.',
    type: 'date',
  },
  {
    key: 'eventVenue',
    label: 'Local do evento',
    category: 'Evento',
    defaultValue: 'DETI · Universidade de Aveiro',
    description: 'Local apresentado nas comunicações aos participantes.',
    type: 'text',
  },
  {
    key: 'eventAddress',
    label: 'Morada do evento',
    category: 'Evento',
    defaultValue: 'Campus Universitário de Santiago, Aveiro',
    description: 'Morada pública do evento.',
    type: 'text',
  },
  {
    key: 'eventPageUrl',
    label: 'URL do evento',
    category: 'Evento',
    defaultValue: 'https://nei-aauav.github.io/deti-plus-26/',
    description: 'URL pública usada nos botões e assets dos emails.',
    type: 'text',
  },
  {
    key: 'registrationEnabled',
    label: 'Inscrições ativas',
    category: 'Inscrições',
    defaultValue: true,
    description: 'Interruptor principal. Desativar bloqueia novas inscrições.',
    type: 'boolean',
  },
  {
    key: 'registrationOpensAt',
    label: 'Abertura das inscrições',
    category: 'Inscrições',
    defaultValue: '',
    description: 'Data e hora de abertura. Deixar vazio para não limitar o início.',
    type: 'date',
  },
  {
    key: 'registrationClosesAt',
    label: 'Fecho das inscrições',
    category: 'Inscrições',
    defaultValue: '',
    description: 'Data e hora de fecho. Deixar vazio para não limitar o fim.',
    type: 'date',
  },
  {
    key: 'maxRegistrations',
    label: 'Lotação',
    category: 'Inscrições',
    defaultValue: 0,
    description: 'Número máximo de inscrições confirmadas. 0 significa sem limite.',
    type: 'number',
  },
  {
    key: 'waitlistEnabled',
    label: 'Lista de espera ativa',
    category: 'Lista de espera',
    defaultValue: false,
    description: 'Quando a lotação é atingida, permite colocar novas inscrições em espera.',
    type: 'boolean',
  },
  {
    key: 'maxWaitlist',
    label: 'Limite da lista de espera',
    category: 'Lista de espera',
    defaultValue: 0,
    description: 'Número máximo de pessoas em espera. 0 significa sem limite.',
    type: 'number',
  },
  {
    key: 'cvUploadsEnabled',
    label: 'Envio de CV ativo',
    category: 'CV',
    defaultValue: true,
    description: 'Permite enviar ou substituir CVs.',
    type: 'boolean',
  },
  {
    key: 'cvDeadline',
    label: 'Prazo para envio de CV',
    category: 'CV',
    defaultValue: '',
    description: 'Data e hora limite para envio/substituição de CV. Vazio = sem prazo.',
    type: 'date',
  },
  {
    key: 'emailRemindersEnabled',
    label: 'Lembretes por email',
    category: 'Emails',
    defaultValue: true,
    description: 'Ativa os lembretes automáticos de CV, evento e pós-evento.',
    type: 'boolean',
  },
  {
    key: 'dataRetentionUntil',
    label: 'Retenção de dados até',
    category: 'Privacidade',
    defaultValue: '',
    description: 'Data a partir da qual os dados pessoais devem ser revistos para eliminação.',
    type: 'date',
  },
];

function getEventConfig_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(EVENT_CONFIG_CACHE_KEY);

  if (cached) {
    try {
      return deserializeEventConfig_(JSON.parse(cached));
    } catch (err) {
      console.warn('Ignoring invalid event configuration cache: ' + err);
      cache.remove(EVENT_CONFIG_CACHE_KEY);
    }
  }

  const settings = getSettingsMap_();
  const config = {
    eventName: settingText_(settings.eventName, 'DETI+ 2026'),
    timezone: settingText_(settings.timezone, DEFAULT_EVENT_TIMEZONE),
    eventStartsAt: settingDate_(settings.eventStartsAt),
    eventEndsAt: settingDate_(settings.eventEndsAt),
    eventVenue: settingText_(settings.eventVenue, 'DETI · Universidade de Aveiro'),
    eventAddress: settingText_(settings.eventAddress, 'Campus Universitário de Santiago, Aveiro'),
    eventPageUrl: settingText_(settings.eventPageUrl, ''),
    registrationEnabled: settingBoolean_(settings.registrationEnabled, true),
    registrationOpensAt: settingDate_(settings.registrationOpensAt),
    registrationClosesAt: settingDate_(settings.registrationClosesAt),
    maxRegistrations: settingNonNegativeInteger_(settings.maxRegistrations, 0),
    waitlistEnabled: settingBoolean_(settings.waitlistEnabled, false),
    maxWaitlist: settingNonNegativeInteger_(settings.maxWaitlist, 0),
    cvUploadsEnabled: settingBoolean_(settings.cvUploadsEnabled, true),
    cvDeadline: settingDate_(settings.cvDeadline),
    emailRemindersEnabled: settingBoolean_(settings.emailRemindersEnabled, true),
    dataRetentionUntil: settingDate_(settings.dataRetentionUntil),
  };

  cache.put(
    EVENT_CONFIG_CACHE_KEY,
    JSON.stringify(serializeEventConfig_(config)),
    EVENT_CONFIG_CACHE_TTL_SECONDS
  );
  return config;
}

function serializeEventConfig_(config) {
  const serialized = Object.assign({}, config);

  [
    'registrationOpensAt',
    'registrationClosesAt',
    'cvDeadline',
    'dataRetentionUntil',
    'eventStartsAt',
    'eventEndsAt',
  ].forEach(function (key) {
    serialized[key] = config[key] ? config[key].toISOString() : null;
  });

  return serialized;
}

function deserializeEventConfig_(config) {
  const restored = Object.assign({}, config);

  [
    'registrationOpensAt',
    'registrationClosesAt',
    'cvDeadline',
    'dataRetentionUntil',
    'eventStartsAt',
    'eventEndsAt',
  ].forEach(function (key) {
    restored[key] = settingDate_(restored[key]);
  });

  return restored;
}

function invalidateEventConfigCache_() {
  CacheService.getScriptCache().remove(EVENT_CONFIG_CACHE_KEY);
}

function invalidateRegistrationStatusCache_() {
  CacheService.getScriptCache().remove(REGISTRATION_STATUS_CACHE_KEY);
}

function validateEventConfig_(config) {
  config = config || getEventConfig_();
  const issues = [];

  if (!config.timezone) {
    issues.push({ level: 'error', key: 'timezone', message: 'O fuso horário é obrigatório.' });
  }

  if (
    config.registrationOpensAt &&
    config.registrationClosesAt &&
    config.registrationOpensAt.getTime() > config.registrationClosesAt.getTime()
  ) {
    issues.push({
      level: 'error',
      key: 'registrationOpensAt',
      message: 'A abertura das inscrições tem de acontecer antes do fecho.',
    });
  }

  if (
    config.eventStartsAt &&
    config.eventEndsAt &&
    config.eventStartsAt.getTime() >= config.eventEndsAt.getTime()
  ) {
    issues.push({
      level: 'error',
      key: 'eventStartsAt',
      message: 'O início do evento tem de acontecer antes do fim.',
    });
  }

  if (config.maxRegistrations < 0) {
    issues.push({
      level: 'error',
      key: 'maxRegistrations',
      message: 'A lotação não pode ser negativa.',
    });
  }

  if (config.maxWaitlist < 0) {
    issues.push({
      level: 'error',
      key: 'maxWaitlist',
      message: 'O limite da lista de espera não pode ser negativo.',
    });
  }

  return issues;
}

function getRegistrationState_(config, counts) {
  config = config || getEventConfig_();
  counts = counts || getRegistrationCounters_();
  const now = new Date();

  if (validateEventConfig_(config).some(function (issue) { return issue.level === 'error'; })) {
    return {
      state: 'closed',
      capacity: config.maxRegistrations,
      registered: counts.registered,
      waitlisted: counts.waitlisted,
      remaining: null,
      percentage: null,
      opensAt: config.registrationOpensAt ? config.registrationOpensAt.toISOString() : null,
      closesAt: config.registrationClosesAt ? config.registrationClosesAt.toISOString() : null,
      waitlistEnabled: config.waitlistEnabled,
      maxWaitlist: config.maxWaitlist,
      eventName: config.eventName,
    };
  }

  const capacity = config.maxRegistrations;
  const hasCapacityLimit = capacity > 0;
  let remaining = null;
  let percentage = null;

  if (hasCapacityLimit) {
    remaining = Math.max(capacity - counts.registered, 0);
    percentage = Math.min((counts.registered / capacity) * 100, 100);
  }

  let state = 'open';

  if (!config.registrationEnabled) {
    state = 'disabled';
  } else if (config.registrationOpensAt && now.getTime() < config.registrationOpensAt.getTime()) {
    state = 'not_started';
  } else if (config.registrationClosesAt && now.getTime() >= config.registrationClosesAt.getTime()) {
    state = 'closed';
  } else if (hasCapacityLimit && counts.registered >= capacity) {
    const waitlistHasSpace =
      config.waitlistEnabled &&
      (config.maxWaitlist === 0 || counts.waitlisted < config.maxWaitlist);
    state = waitlistHasSpace ? 'waitlist' : 'full';
  } else if (hasCapacityLimit && counts.registered / capacity >= 0.9) {
    state = 'almost_full';
  }

  return {
    state: state,
    opensAt: config.registrationOpensAt ? config.registrationOpensAt.toISOString() : null,
    closesAt: config.registrationClosesAt ? config.registrationClosesAt.toISOString() : null,
    capacity: capacity,
    registered: counts.registered,
    waitlisted: counts.waitlisted,
    remaining: remaining,
    percentage: percentage === null ? null : Math.round(percentage * 10) / 10,
    waitlistEnabled: config.waitlistEnabled,
    maxWaitlist: config.maxWaitlist,
    eventName: config.eventName,
  };
}

function handleRegistrationStatus_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(REGISTRATION_STATUS_CACHE_KEY);

  if (cached) {
    try {
      return ok_(JSON.parse(cached));
    } catch (err) {
      console.warn('Ignoring invalid registration status cache: ' + err);
      cache.remove(REGISTRATION_STATUS_CACHE_KEY);
    }
  }

  const state = getRegistrationState_();
  cache.put(
    REGISTRATION_STATUS_CACHE_KEY,
    JSON.stringify(state),
    REGISTRATION_STATUS_CACHE_TTL_SECONDS
  );
  return ok_(state);
}

function getRegistrationAdmission_(availability) {
  switch (availability.state) {
    case 'open':
    case 'almost_full':
      return { allowed: true, registrationStatus: 'confirmed' };
    case 'waitlist':
      return { allowed: true, registrationStatus: 'waitlisted' };
    case 'disabled':
      return {
        allowed: false,
        error: 'registration_disabled',
        message: 'Registrations are currently unavailable.',
      };
    case 'not_started':
      return {
        allowed: false,
        error: 'registration_not_started',
        message: 'Registrations have not opened yet.',
      };
    case 'closed':
      return {
        allowed: false,
        error: 'registration_closed',
        message: 'Registrations are closed.',
      };
    case 'full':
      return {
        allowed: false,
        error: 'registration_full',
        message: 'All available places have been filled.',
      };
    default:
      return {
        allowed: false,
        error: 'registration_disabled',
        message: 'Registrations are currently unavailable.',
      };
  }
}

function registrationStatusFromRecord_(record) {
  return normalizedRegistrationStatus_(record);
}

function getRegistrationCounts_() {
  return getRegistrationCounters_();
}

function emptyRegistrationCounters_() {
  return { registered: 0, waitlisted: 0, cancelled: 0, checkedIn: 0 };
}

function getRegistrationCounters_(options) {
  options = options || {};
  const properties = PropertiesService.getScriptProperties();
  const raw = properties.getProperty(REGISTRATION_COUNTERS_PROPERTY_KEY);

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        registered: Math.max(0, Number(parsed.registered) || 0),
        waitlisted: Math.max(0, Number(parsed.waitlisted) || 0),
        cancelled: Math.max(0, Number(parsed.cancelled) || 0),
        checkedIn: Math.max(0, Number(parsed.checkedIn) || 0),
      };
    } catch (err) {
      console.warn('Ignoring invalid registration counters: ' + err);
    }
  }

  if (options.lockHeld) return rebuildRegistrationCounters_({ lockHeld: true });

  const lock = LockService.getScriptLock();
  lock.waitLock(REGISTRATION_COUNTERS_LOCK_TIMEOUT_MS);

  try {
    if (properties.getProperty(REGISTRATION_COUNTERS_PROPERTY_KEY)) {
      return getRegistrationCounters_();
    }
    return rebuildRegistrationCounters_({ lockHeld: true });
  } finally {
    lock.releaseLock();
  }
}

function setRegistrationCounters_(counters) {
  const normalized = {
    registered: Math.max(0, Number(counters.registered) || 0),
    waitlisted: Math.max(0, Number(counters.waitlisted) || 0),
    cancelled: Math.max(0, Number(counters.cancelled) || 0),
    checkedIn: Math.max(0, Number(counters.checkedIn) || 0),
  };

  PropertiesService.getScriptProperties().setProperty(
    REGISTRATION_COUNTERS_PROPERTY_KEY,
    JSON.stringify(normalized)
  );
  return normalized;
}

function updateRegistrationCountersForTransition_(
  previousStatus,
  nextStatus,
  wasCheckedIn,
  isCheckedIn,
  options
) {
  const counters = getRegistrationCounters_(options);
  const changes = emptyRegistrationCounters_();

  const applyStatus = function (status, direction) {
    if (status === 'confirmed') changes.registered += direction;
    else if (status === 'waitlisted') changes.waitlisted += direction;
    else if (status === 'cancelled') changes.cancelled += direction;
  };

  applyStatus(previousStatus, -1);
  applyStatus(nextStatus, 1);
  if (wasCheckedIn) changes.checkedIn--;
  if (isCheckedIn) changes.checkedIn++;

  return setRegistrationCounters_({
    registered: counters.registered + changes.registered,
    waitlisted: counters.waitlisted + changes.waitlisted,
    cancelled: counters.cancelled + changes.cancelled,
    checkedIn: counters.checkedIn + changes.checkedIn,
  });
}

function rebuildRegistrationCounters_(options) {
  options = options || {};
  const sheet = getSheet_();
  const map = getHeaderMap_(sheet);
  const lastRow = sheet.getLastRow();
  const counters = emptyRegistrationCounters_();

  if (lastRow < 2) return setRegistrationCounters_(counters);

  const rowCount = lastRow - 1;
  const valuesFor = function (column) {
    return column
      ? sheet.getRange(2, column, rowCount, 1).getValues()
      : Array.from({ length: rowCount }, function () { return ['']; });
  };

  const emails = valuesFor(map.email);
  const tokens = valuesFor(map.token);
  const statuses = valuesFor(map.registrationStatus);
  const legacyStates = valuesFor(map.state);
  const checkedIns = valuesFor(map.checkedIn);

  for (let i = 0; i < rowCount; i++) {
    if (!String(emails[i][0] || '').trim() && !String(tokens[i][0] || '').trim()) continue;

    const status = normalizedRegistrationStatus_({
      registrationStatus: statuses[i][0],
      state: legacyStates[i][0],
    });

    if (status === 'cancelled') counters.cancelled++;
    else if (status === 'waitlisted') counters.waitlisted++;
    else {
      counters.registered++;
      if (isRecordCheckedIn_({ checkedIn: checkedIns[i][0], registrationStatus: status })) {
        counters.checkedIn++;
      }
    }
  }

  const result = setRegistrationCounters_(counters);
  invalidateRegistrationStatusCache_();
  console.log('Registration counters rebuilt: ' + JSON.stringify(result));
  return result;
}

function settingBoolean_(value, fallback) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value == null ? '' : value).trim().toLowerCase();
  if (['true', 'yes', 'sim', '1'].indexOf(normalized) !== -1) return true;
  if (['false', 'no', 'não', 'nao', '0'].indexOf(normalized) !== -1) return false;
  return fallback;
}

function settingNonNegativeInteger_(value, fallback) {
  if (value === '' || value === null || typeof value === 'undefined') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function settingDate_(value) {
  if (value === '' || value === null || typeof value === 'undefined') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function settingText_(value, fallback) {
  const text = String(value == null ? '' : value).trim();
  return text || fallback;
}
