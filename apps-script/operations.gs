/** Operational jobs: queue, waitlist, exports, retention and triggers. */
const EMAIL_QUEUE_SHEET_NAME = 'Email Queue';
const EMAIL_QUEUE_HEADERS = ['createdAt','sendAfter','recipient','subject','textBody','htmlBody','replyTo','attempts','status','lastError','sentAt','type','registrationId'];

function getEmailQueueSheet_() {
  const sheet = getOrCreateSheet_(EMAIL_QUEUE_SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, EMAIL_QUEUE_HEADERS.length).setValues([EMAIL_QUEUE_HEADERS]);
  else EMAIL_QUEUE_HEADERS.forEach(function (header, index) { if (String(sheet.getRange(1, index + 1).getValue() || '') !== header) sheet.getRange(1, index + 1).setValue(header); });
  sheet.setFrozenRows(1);
  return sheet;
}

function queueParticipantEmail_(email) {
  const sheet = getEmailQueueSheet_();
  sheet.appendRow([new Date(), email.sendAfter || new Date(), email.recipient, email.subject, email.textBody, email.htmlBody || '', email.replyTo || '', 0, 'pending', '', '', email.type || '', email.registrationId || '']);
}

function processEmailQueue() {
  const sheet = getEmailQueueSheet_();
  const rows = readRecords_(sheet);
  const quota = MailApp.getRemainingDailyQuota();
  let sent = 0;
  rows.some(function (entry) {
    if (sent >= 30 || quota <= sent) return true;
    const record = entry.record;
    if (String(record.status) !== 'pending' || new Date(record.sendAfter).getTime() > Date.now()) return false;
    const attempts = Number(record.attempts || 0);
    try {
      MailApp.sendEmail(record.recipient, record.subject, record.textBody, { name: 'DETI+', replyTo: record.replyTo || undefined, htmlBody: record.htmlBody || undefined });
      setCells_(sheet, entry.row, { status: 'sent', sentAt: new Date(), lastError: '' });
      sent++;
    } catch (err) {
      const next = attempts + 1;
      setCells_(sheet, entry.row, { attempts: next, status: next >= 3 ? 'failed' : 'pending', lastError: String(err).slice(0, 500) });
    }
    return false;
  });
  return { sent: sent, quota: quota };
}

function waitlistEntriesSorted_(sheet) {
  return readRecords_(sheet).filter(function (entry) { return normalizedRegistrationStatus_(entry.record) === 'waitlisted'; }).sort(function (a, b) {
    const ad = new Date(a.record.registeredAt || a.record.timestamp || 0).getTime() || 0;
    const bd = new Date(b.record.registeredAt || b.record.timestamp || 0).getTime() || 0;
    return ad - bd || a.row - b.row;
  });
}

function promoteNextWaitlistedUnlocked_(sheet, reason) {
  const config = getEventConfig_();
  const counts = getRegistrationCounts_();
  if (config.maxRegistrations <= 0 || counts.registered >= config.maxRegistrations) return null;
  const next = waitlistEntriesSorted_(sheet)[0];
  if (!next) return null;
  const cvStatus = normalizedCvStatus_(next.record);
  setCells_(sheet, next.row, { registrationStatus: 'confirmed', state: legacyStateFor_('confirmed', cvStatus), checkedIn: false, checkedInAt: '' });
  next.record.registrationStatus = 'confirmed'; next.record.state = legacyStateFor_('confirmed', cvStatus); next.record.checkedIn = false; next.record.checkedInAt = '';
  logAudit_('REGISTRATION_PROMOTED', next.record, 'waitlisted', 'confirmed', reason || 'Participant promoted from waiting list.', getAdminActor_());
  sendPromotionEmail_(next.record);
  return next.record;
}

function promoteNextWaitlisted() {
  return withAdminLock_(function () { return promoteNextWaitlistedUnlocked_(getSheet_(), 'Manual waitlist promotion.'); });
}

function checkCapacityNotifications_() {
  const config = getEventConfig_(); const counts = getRegistrationCounts_();
  if (!config.maxRegistrations) return;
  const percentage = counts.registered / config.maxRegistrations * 100;
  [80, 90, 100].forEach(function (threshold) {
    const key = 'CAPACITY_NOTIFICATION_' + threshold;
    if (percentage >= threshold && !PropertiesService.getScriptProperties().getProperty(key)) {
      MailApp.sendEmail(prop_('EVENT_EMAIL'), 'DETI+ capacity ' + threshold + '%', counts.registered + '/' + config.maxRegistrations + ' confirmed registrations.');
      PropertiesService.getScriptProperties().setProperty(key, '1');
    }
  });
}
function resetCapacityNotifications() { const props = PropertiesService.getScriptProperties(); [80,90,100].forEach(function(t){ props.deleteProperty('CAPACITY_NOTIFICATION_' + t); }); }

function exportRowsCsv_(name, rows, extraHeader) {
  const header = (extraHeader || []).concat(['registrationId','name','email','mobileNumber','course','year','registrationStatus','cvStatus','registeredAt','checkedIn','checkedInAt','cancelledAt','notes']);
  const esc = function (value) { return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"'; };
  const lines = [header.map(esc).join(',')].concat(rows.map(function (entry, index) { const r = entry.record; return (extraHeader ? [index + 1] : []).concat([r.registrationId,r.name,r.email,r.mobileNumber,r.course || r.curse,r.year,normalizedRegistrationStatus_(r),normalizedCvStatus_(r),r.registeredAt,isRecordCheckedIn_(r),r.checkedInAt,r.cancelledAt,r.notes]).map(esc).join(','); }));
  const folder = DriveApp.getFolderById(prop_('CV_FOLDER_ID')).getParents().hasNext() ? DriveApp.getFolderById(prop_('CV_FOLDER_ID')).getParents().next() : DriveApp.getRootFolder();
  const exports = folder.getFoldersByName('DETI+ Exports'); const exportFolder = exports.hasNext() ? exports.next() : folder.createFolder('DETI+ Exports');
  const file = exportFolder.createFile('DETI+_' + name + '_' + Utilities.formatDate(new Date(), getEventConfig_().timezone || DEFAULT_EVENT_TIMEZONE, 'yyyyMMdd-HHmmss') + '.csv', lines.join('\n'), MimeType.CSV);
  logAudit_('PARTICIPANTS_EXPORTED', { registrationId: '' }, '', '', name + ' CSV exported.', getAdminActor_()); return file.getUrl();
}
function exportParticipantsCsv() { return exportRowsCsv_('participants', readRecords_(getSheet_())); }
function exportConfirmedParticipantsCsv() { return exportRowsCsv_('confirmed', readRecords_(getSheet_()).filter(function(e){return normalizedRegistrationStatus_(e.record)==='confirmed';})); }
function exportWaitlistCsv() { return exportRowsCsv_('waitlist', waitlistEntriesSorted_(getSheet_()), ['waitlistPosition']); }
function exportCheckInListCsv() { return exportRowsCsv_('checkin', readRecords_(getSheet_()).filter(function(e){return normalizedRegistrationStatus_(e.record)==='confirmed';})); }
function exportCvIndexCsv() { const rows = readRecords_(getSheet_()).filter(function(e){return e.record.cvFileId;}); return exportRowsCsv_('cv-index', rows); }

function runDataRetention() {
  const until = getEventConfig_().dataRetentionUntil; if (!until || Date.now() < until.getTime()) return { changed: 0 };
  return withAdminLock_(function () { const sheet = getSheet_(); let changed = 0; readRecords_(sheet).forEach(function (entry) { const r = entry.record; if (!r.registrationId || !r.email) return; if (r.cvFileId) try { DriveApp.getFileById(r.cvFileId).setTrashed(true); } catch (err) { console.warn('Retention CV trash failed: ' + err); }
    setCells_(sheet, entry.row, { token:'', name:'', email:'', mobileNumber:'', course:'', hasCvConsent:'', hasGdprConsent:'', cvFileId:'', cvName:'', notes:'', curse:'' }); changed++; }); if (changed) logAudit_('DATA_RETENTION_APPLIED', { registrationId: '' }, '', '', changed + ' participant rows anonymized.', 'SYSTEM'); return { changed: changed }; });
}

function ensureTimeTrigger_(handler, minutes) { ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()===handler;}).slice(1).forEach(function(t){ScriptApp.deleteTrigger(t);}); if (!ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()===handler;})) ScriptApp.newTrigger(handler).timeBased().everyMinutes(minutes).create(); }
function installOperationalTriggers() { ensureAdminEditTrigger_(); ensureRegistrationEditTrigger_(); ensureTimeTrigger_('processEmailQueue', 5); ensureTimeTrigger_('refreshControlCenterScheduled_', 15); const existing = ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='runDataRetention';}); existing.slice(1).forEach(function(t){ScriptApp.deleteTrigger(t);}); if (!existing.length) ScriptApp.newTrigger('runDataRetention').timeBased().everyDays(1).create(); }
function refreshControlCenterScheduled_() { refreshControlCenter_(); }
function applyOperationalProtections() { [getOrCreateSheet_(DASHBOARD_SHEET_NAME), getOrCreateSheet_(STATISTICS_SHEET_NAME), getAuditSheet_(), getEmailQueueSheet_(), getSettingsSheet_(), getSheet_()].forEach(function(sheet){ sheet.protect().setWarningOnly(true); }); }
