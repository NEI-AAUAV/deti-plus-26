/**
 * DETI+ 2026 - event configuration
 *
 * Public/event configuration is stored in the "Settings" sheet.
 * Technical secrets and infrastructure identifiers remain in Script Properties.
 */

const SETTINGS_SHEET_NAME = 'Settings';
const DEFAULT_EVENT_TIMEZONE = 'Europe/Lisbon';

/**
 * The internal key is deliberately kept separate from the human label.
 * The Settings sheet displays label/category/help while the backend continues
 * consuming the stable keys below.
 */
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
    key: 'dataRetentionUntil',
    label: 'Retenção de dados até',
    category: 'Privacidade',
    defaultValue: '',
    description: 'Data a partir da qual os dados pessoais devem ser revistos para eliminação.',
    type: 'date',
  },
];

function getEventConfig_() {
  const settings = getSettingsMap_();

  return {
    registrationEnabled: settingBoolean_(settings.registrationEnabled, true),
    registrationOpensAt: settingDate_(settings.registrationOpensAt),
    registrationClosesAt: settingDate_(settings.registrationClosesAt),
    maxRegistrations: settingNonNegativeInteger_(settings.maxRegistrations, 0),
    waitlistEnabled: settingBoolean_(settings.waitlistEnabled, false),
    maxWaitlist: settingNonNegativeInteger_(settings.maxWaitlist, 0),
    cvUploadsEnabled: settingBoolean_(settings.cvUploadsEnabled, true),
    cvDeadline: settingDate_(settings.cvDeadline),
    eventName: settingText_(settings.eventName, 'DETI+ 2026'),
    timezone: settingText_(settings.timezone, DEFAULT_EVENT_TIMEZONE),
    dataRetentionUntil: settingDate_(settings.dataRetentionUntil),
  };
}

function validateEventConfig_() {
  const config = getEventConfig_();
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

  if (config.maxRegistrations < 0) {
    issues.push({ level: 'error', key: 'maxRegistrations', message: 'A lotação não pode ser negativa.' });
  }

  if (config.maxWaitlist < 0) {
    issues.push({ level: 'error', key: 'maxWaitlist', message: 'O limite da lista de espera não pode ser negativo.' });
  }

  return issues;
}

function getRegistrationState_() {
  const config = getEventConfig_();
  const counts = getRegistrationCounts_();
  const now = new Date();

  if (validateEventConfig_().some(function (issue) { return issue.level === 'error'; })) {
    return {
      state: 'closed',
      capacity: config.maxRegistrations,
      registered: counts.registered,
      waitlisted: counts.waitlisted,
      remaining: null,
      percentage: null,
      opensAt: config.registrationOpensAt,
      closesAt: config.registrationClosesAt,
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
  return ok_(getRegistrationState_());
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
  const sheet = getSheet_();
  const rows = readRecords_(sheet);

  let registered = 0;
  let waitlisted = 0;
  let cancelled = 0;
  let checkedIn = 0;

  rows.forEach(function (entry) {
    const record = entry.record;

    if (!String(record.email || '').trim() && !String(record.token || '').trim()) {
      return;
    }

    const status = normalizedRegistrationStatus_(record);

    if (status === 'cancelled') {
      cancelled++;
      return;
    }

    if (status === 'waitlisted') {
      waitlisted++;
      return;
    }

    if (isRecordCheckedIn_(record)) {
      checkedIn++;
    }

    registered++;
  });

  return {
    registered: registered,
    waitlisted: waitlisted,
    cancelled: cancelled,
    checkedIn: checkedIn,
  };
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

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function settingText_(value, fallback) {
  const text = String(value == null ? '' : value).trim();
  return text || fallback;
}
