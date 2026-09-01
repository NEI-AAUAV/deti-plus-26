/**
 * DETI+ 2026 - operational jobs: queue, waitlist, exports, retention and triggers.
 */

const EMAIL_QUEUE_SHEET_NAME = 'Email Queue';
const EMAIL_QUEUE_HEADERS = [
  'createdAt',
  'sendAfter',
  'recipient',
  'subject',
  'textBody',
  'htmlBody',
  'replyTo',
  'attempts',
  'status',
  'lastError',
  'sentAt',
  'type',
  'registrationId',
  'templateKey',
  'dedupeKey',
  'lastAttemptAt',
];

function getEmailQueueSheet_() {
  const sheet = getOrCreateSheet_(EMAIL_QUEUE_SHEET_NAME);
  ensureEmailQueueSheet_(sheet);
  formatEmailQueueSheet_(sheet);
  return sheet;
}

function getEmailQueueSheetFast_() {
  const sheet = getSpreadsheet_().getSheetByName(EMAIL_QUEUE_SHEET_NAME);
  if (!sheet) return getEmailQueueSheet_();
  ensureEmailQueueSheet_(sheet);
  return sheet;
}

/**
 * Extends existing queues in place. Existing rows remain untouched; new
 * lifecycle columns are appended to the right when missing.
 */
function ensureEmailQueueSheet_(sheet) {
  ensureSheetSize_(sheet, Math.max(sheet.getMaxRows(), 2), EMAIL_QUEUE_HEADERS.length);

  if (sheet.getLastRow() === 0) {
    sheet
      .getRange(1, 1, 1, EMAIL_QUEUE_HEADERS.length)
      .setValues([EMAIL_QUEUE_HEADERS]);
    return;
  }

  const existing = sheet
    .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1))
    .getValues()[0]
    .map(function (value) { return String(value || '').trim(); });

  EMAIL_QUEUE_HEADERS.forEach(function (header) {
    if (existing.indexOf(header) !== -1) return;

    const targetColumn = existing.length + 1;
    ensureSheetSize_(sheet, Math.max(sheet.getMaxRows(), 2), targetColumn);
    sheet.getRange(1, targetColumn).setValue(header);
    existing.push(header);
  });
}

function formatEmailQueueSheet_(sheet) {
  applyDetiSheetBase_(sheet, '#737373');
  sheet.setFrozenRows(1);

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) return;

  sheet
    .getRange(1, 1, 1, lastColumn)
    .setBackground(DETI_SHEET_THEME.black)
    .setFontColor(DETI_SHEET_THEME.white)
    .setFontWeight('bold')
    .setFontFamily(DETI_SHEET_THEME.font);

  sheet.setRowHeight(1, 40);

  const widths = [
    155, 155, 230, 300, 320, 320, 220, 80,
    100, 280, 155, 170, 130, 190, 300, 155,
  ];

  widths.forEach(function (width, index) {
    if (index + 1 <= lastColumn) sheet.setColumnWidth(index + 1, width);
  });

  if (lastRow >= 2) {
    sheet
      .getRange(2, 1, lastRow - 1, lastColumn)
      .setFontFamily(DETI_SHEET_THEME.font)
      .setVerticalAlignment('middle');

    [1, 2, 11, 16].forEach(function (column) {
      if (column <= lastColumn) {
        sheet
          .getRange(2, column, lastRow - 1, 1)
          .setNumberFormat('dd/mm/yyyy hh:mm');
      }
    });
  }

  if (lastColumn >= 6) sheet.hideColumns(5, 2);
}

function queueParticipantEmail_(email) {
  const sheet = getEmailQueueSheetFast_();

  if (
    email.dedupeKey &&
    !email.skipDedupeLookup &&
    emailQueueHasDedupeKey_(email.dedupeKey, sheet)
  ) {
    return false;
  }

  const map = getHeaderMap_(sheet);
  const row = sheet.getLastRow() + 1;
  const values = new Array(sheet.getLastColumn()).fill('');

  const set = function (key, value) {
    if (map[key]) values[map[key] - 1] = value;
  };

  set('createdAt', new Date());
  set('sendAfter', email.sendAfter || new Date());
  set('recipient', email.recipient);
  set('subject', email.subject);
  set('textBody', email.textBody);
  set('htmlBody', email.htmlBody || '');
  set('replyTo', email.replyTo || '');
  set('attempts', 0);
  set('status', 'pending');
  set('lastError', '');
  set('sentAt', '');
  set('type', email.type || '');
  set('registrationId', email.registrationId || '');
  set('templateKey', email.templateKey || '');
  set('dedupeKey', email.dedupeKey || '');
  set('lastAttemptAt', '');

  sheet.getRange(row, 1, 1, values.length).setValues([values]);
  return true;
}

function emailQueueHasDedupeKey_(dedupeKey, sheet) {
  if (!dedupeKey) return false;

  sheet = sheet || getEmailQueueSheetFast_();
  const map = getHeaderMap_(sheet);
  if (!map.dedupeKey || sheet.getLastRow() < 2) return false;

  const found = sheet
    .getRange(2, map.dedupeKey, sheet.getLastRow() - 1, 1)
    .createTextFinder(String(dedupeKey))
    .matchEntireCell(true)
    .findNext();

  return Boolean(found);
}


function getEmailQueueDedupeSet_() {
  const sheet = getEmailQueueSheetFast_();
  const map = getHeaderMap_(sheet);
  const set = new Set();

  if (!map.dedupeKey || sheet.getLastRow() < 2) return set;

  sheet
    .getRange(2, map.dedupeKey, sheet.getLastRow() - 1, 1)
    .getValues()
    .forEach(function (row) {
      const key = String(row[0] || '').trim();
      if (key) set.add(key);
    });

  return set;
}

function processEmailQueue() {
  const sheet = getEmailQueueSheet_();
  const rows = readRecords_(sheet);
  const quota = MailApp.getRemainingDailyQuota();
  let sent = 0;

  rows.some(function (entry) {
    if (sent >= 30 || quota <= sent) return true;

    const record = entry.record;
    if (String(record.status) !== 'pending') return false;

    const sendAfter = new Date(record.sendAfter).getTime();
    if (Number.isFinite(sendAfter) && sendAfter > Date.now()) return false;

    const attempts = Number(record.attempts || 0);

    try {
      MailApp.sendEmail(record.recipient, record.subject, record.textBody, {
        name: 'DETI+',
        replyTo: record.replyTo || undefined,
        htmlBody: record.htmlBody || undefined,
      });

      setCells_(sheet, entry.row, {
        status: 'sent',
        sentAt: new Date(),
        lastAttemptAt: new Date(),
        lastError: '',
      });
      sent++;
    } catch (err) {
      const next = attempts + 1;
      const failed = next >= 3;
      const delayMinutes = next === 1 ? 5 : 30;
      const retryAt = failed
        ? new Date()
        : new Date(Date.now() + delayMinutes * 60 * 1000);

      setCells_(sheet, entry.row, {
        attempts: next,
        status: failed ? 'failed' : 'pending',
        sendAfter: retryAt,
        lastAttemptAt: new Date(),
        lastError: String(err).slice(0, 500),
      });
    }

    return false;
  });

  return { sent: sent, quota: quota };
}

function waitlistEntriesSorted_(sheet) {
  return readRecords_(sheet)
    .filter(function (entry) {
      return normalizedRegistrationStatus_(entry.record) === 'waitlisted';
    })
    .sort(function (a, b) {
      const ad = new Date(a.record.registeredAt || a.record.timestamp || 0).getTime() || 0;
      const bd = new Date(b.record.registeredAt || b.record.timestamp || 0).getTime() || 0;
      return ad - bd || a.row - b.row;
    });
}

function promoteNextWaitlistedUnlocked_(sheet, reason) {
  const config = getEventConfig_();
  const counts = getRegistrationCounters_({ lockHeld: true });

  if (config.maxRegistrations <= 0 || counts.registered >= config.maxRegistrations) {
    return null;
  }

  const next = waitlistEntriesSorted_(sheet)[0];
  if (!next) return null;

  const cvStatus = normalizedCvStatus_(next.record);

  setCells_(sheet, next.row, {
    registrationStatus: 'confirmed',
    state: legacyStateFor_('confirmed', cvStatus),
    checkedIn: false,
    checkedInAt: '',
  });

  next.record.registrationStatus = 'confirmed';
  next.record.state = legacyStateFor_('confirmed', cvStatus);
  next.record.checkedIn = false;
  next.record.checkedInAt = '';

  updateRegistrationCountersForTransition_(
    'waitlisted',
    'confirmed',
    false,
    false,
    { lockHeld: true }
  );
  invalidateRegistrationStatusCache_();

  logAudit_(
    'REGISTRATION_PROMOTED',
    next.record,
    'waitlisted',
    'confirmed',
    reason || 'Participant promoted from waiting list.',
    getAdminActor_()
  );

  sendPromotionEmail_(next.record);
  return next.record;
}

function promoteNextWaitlisted() {
  return withAdminLock_(function () {
    return promoteNextWaitlistedUnlocked_(
      getSheet_(),
      'Manual waitlist promotion.'
    );
  });
}

function checkCapacityNotifications_() {
  const config = getEventConfig_();
  const counts = getRegistrationCounters_();
  if (!config.maxRegistrations) return;

  const percentage = (counts.registered / config.maxRegistrations) * 100;

  [80, 90, 100].forEach(function (threshold) {
    const key = 'CAPACITY_NOTIFICATION_' + threshold;

    if (
      percentage >= threshold &&
      !PropertiesService.getScriptProperties().getProperty(key)
    ) {
      MailApp.sendEmail(
        prop_('EVENT_EMAIL'),
        'DETI+ capacity ' + threshold + '%',
        counts.registered + '/' + config.maxRegistrations + ' confirmed registrations.'
      );
      PropertiesService.getScriptProperties().setProperty(key, '1');
    }
  });
}

function resetCapacityNotifications() {
  const props = PropertiesService.getScriptProperties();
  [80, 90, 100].forEach(function (threshold) {
    props.deleteProperty('CAPACITY_NOTIFICATION_' + threshold);
  });
}

function exportRowsCsv_(name, rows, extraHeader) {
  const header = (extraHeader || []).concat([
    'registrationId',
    'name',
    'email',
    'mobileNumber',
    'course',
    'year',
    'registrationStatus',
    'cvStatus',
    'registeredAt',
    'checkedIn',
    'checkedInAt',
    'cancelledAt',
    'notes',
  ]);

  const esc = function (value) {
    return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"';
  };

  const lines = [header.map(esc).join(',')].concat(
    rows.map(function (entry, index) {
      const r = entry.record;
      return (extraHeader ? [index + 1] : [])
        .concat([
          r.registrationId,
          r.name,
          r.email,
          r.mobileNumber,
          r.course || r.curse,
          r.year,
          normalizedRegistrationStatus_(r),
          normalizedCvStatus_(r),
          r.registeredAt,
          isRecordCheckedIn_(r),
          r.checkedInAt,
          r.cancelledAt,
          r.notes,
        ])
        .map(esc)
        .join(',');
    })
  );

  const cvFolder = DriveApp.getFolderById(prop_('CV_FOLDER_ID'));
  const folder = cvFolder.getParents().hasNext()
    ? cvFolder.getParents().next()
    : DriveApp.getRootFolder();
  const exports = folder.getFoldersByName('DETI+ Exports');
  const exportFolder = exports.hasNext() ? exports.next() : folder.createFolder('DETI+ Exports');

  const file = exportFolder.createFile(
    'DETI+_' +
      name +
      '_' +
      Utilities.formatDate(
        new Date(),
        getEventConfig_().timezone || DEFAULT_EVENT_TIMEZONE,
        'yyyyMMdd-HHmmss'
      ) +
      '.csv',
    lines.join('\n'),
    MimeType.CSV
  );

  logAudit_(
    'PARTICIPANTS_EXPORTED',
    { registrationId: '' },
    '',
    '',
    name + ' CSV exported.',
    getAdminActor_()
  );

  return file.getUrl();
}

function exportParticipantsCsv() {
  return exportRowsCsv_('participants', readRecords_(getSheet_()));
}

function exportConfirmedParticipantsCsv() {
  return exportRowsCsv_(
    'confirmed',
    readRecords_(getSheet_()).filter(function (entry) {
      return normalizedRegistrationStatus_(entry.record) === 'confirmed';
    })
  );
}

function exportWaitlistCsv() {
  return exportRowsCsv_('waitlist', waitlistEntriesSorted_(getSheet_()), ['waitlistPosition']);
}

function exportCheckInListCsv() {
  return exportRowsCsv_(
    'checkin',
    readRecords_(getSheet_()).filter(function (entry) {
      return normalizedRegistrationStatus_(entry.record) === 'confirmed';
    })
  );
}

function exportCvIndexCsv() {
  const rows = readRecords_(getSheet_()).filter(function (entry) {
    return entry.record.cvFileId;
  });
  return exportRowsCsv_('cv-index', rows);
}

function runDataRetention() {
  const until = getEventConfig_().dataRetentionUntil;
  if (!until || Date.now() < until.getTime()) return { changed: 0 };

  return withAdminLock_(function () {
    const sheet = getSheet_();
    let changed = 0;

    readRecords_(sheet).forEach(function (entry) {
      const r = entry.record;
      if (!r.registrationId || !r.email) return;

      if (r.cvFileId) {
        try {
          DriveApp.getFileById(r.cvFileId).setTrashed(true);
        } catch (err) {
          console.warn('Retention CV trash failed: ' + err);
        }
      }

      setCells_(sheet, entry.row, {
        token: '',
        name: '',
        email: '',
        mobileNumber: '',
        course: '',
        hasCvConsent: '',
        hasGdprConsent: '',
        cvFileId: '',
        cvName: '',
        notes: '',
        curse: '',
      });

      changed++;
    });

    if (changed) {
      logAudit_(
        'DATA_RETENTION_APPLIED',
        { registrationId: '' },
        '',
        '',
        changed + ' participant rows anonymized.',
        'SYSTEM'
      );
    }

    return { changed: changed };
  });
}

function ensureTimeTrigger_(handler, minutes) {
  const triggers = ScriptApp.getProjectTriggers().filter(function (trigger) {
    return trigger.getHandlerFunction() === handler;
  });

  triggers.slice(1).forEach(function (trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  if (!triggers.length) {
    ScriptApp.newTrigger(handler).timeBased().everyMinutes(minutes).create();
  }
}

function ensureHourlyTrigger_(handler) {
  const triggers = ScriptApp.getProjectTriggers().filter(function (trigger) {
    return trigger.getHandlerFunction() === handler;
  });

  triggers.slice(1).forEach(function (trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  if (!triggers.length) {
    ScriptApp.newTrigger(handler).timeBased().everyHours(1).create();
  }
}

function installOperationalTriggers() {
  ensureAdminEditTrigger_();
  ensureRegistrationEditTrigger_();
  ensureSettingsEditTrigger_();
  ensureTimeTrigger_('processEmailQueue', 5);
  ensureTimeTrigger_('refreshControlCenterScheduled_', 15);
  ensureHourlyTrigger_('scheduleParticipantCommunications');

  const existing = ScriptApp.getProjectTriggers().filter(function (trigger) {
    return trigger.getHandlerFunction() === 'runDataRetention';
  });

  existing.slice(1).forEach(function (trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  if (!existing.length) {
    ScriptApp.newTrigger('runDataRetention').timeBased().everyDays(1).create();
  }
}

function refreshControlCenterScheduled_() {
  refreshControlCenter_();
}

/**
 * Only system-generated/log sheets receive warning protection.
 * Registration, Settings and Admin are intentionally kept editable.
 */
function applyOperationalProtections() {
  const editableSheets = [getSheet_(), getSettingsSheet_(), getOrCreateAdminSheet_()];
  editableSheets.forEach(function (sheet) {
    removeAllProtections_(sheet);
  });

  const warningOnlySheets = [getAuditSheet_(), getEmailQueueSheet_()];
  warningOnlySheets.forEach(function (sheet) {
    removeAllProtections_(sheet);
    sheet.protect().setWarningOnly(true);
  });

  if (typeof DASHBOARD_SHEET_NAME !== 'undefined') {
    removeAllProtections_(getOrCreateSheet_(DASHBOARD_SHEET_NAME));
  }

  if (typeof STATISTICS_SHEET_NAME !== 'undefined') {
    removeAllProtections_(getOrCreateSheet_(STATISTICS_SHEET_NAME));
  }
}

function removeAllProtections_(sheet) {
  [SpreadsheetApp.ProtectionType.SHEET, SpreadsheetApp.ProtectionType.RANGE].forEach(
    function (type) {
      sheet.getProtections(type).forEach(function (protection) {
        try {
          protection.remove();
        } catch (err) {
          console.warn('Could not remove protection from ' + sheet.getName() + ': ' + err);
        }
      });
    }
  );
}
