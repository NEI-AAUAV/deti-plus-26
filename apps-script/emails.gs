/**
 * DETI+ 2026 - participant email lifecycle and email design system.
 *
 * Responsibilities:
 * - transactional participant messages;
 * - scheduled CV/event reminders;
 * - consistent DETI+ HTML/text rendering;
 * - deduplication keys for scheduled campaigns;
 * - safe queueing: email failures never invalidate a completed registration.
 *
 * Custom fonts are progressive enhancement. The logo is served as a PNG
 * rendered with the real Architype Stedelijk font so branding remains exact
 * even when an email client blocks @font-face.
 */

const EMAIL_TEMPLATE = {
  REGISTRATION_CONFIRMED: 'REGISTRATION_CONFIRMED',
  WAITLIST_JOINED: 'WAITLIST_JOINED',
  MAGIC_LINK: 'MAGIC_LINK',
  CV_RECEIVED: 'CV_RECEIVED',
  WAITLIST_PROMOTED: 'WAITLIST_PROMOTED',
  REGISTRATION_CANCELLED: 'REGISTRATION_CANCELLED',
  REGISTRATION_RESTORED: 'REGISTRATION_RESTORED',
  MOVED_TO_WAITLIST: 'MOVED_TO_WAITLIST',
  CV_REMINDER_7D: 'CV_REMINDER_7D',
  CV_REMINDER_48H: 'CV_REMINDER_48H',
  EVENT_REMINDER_7D: 'EVENT_REMINDER_7D',
  EVENT_REMINDER_24H: 'EVENT_REMINDER_24H',
  EVENT_DAY: 'EVENT_DAY',
  WAITLIST_EVENT_UPDATE: 'WAITLIST_EVENT_UPDATE',
  POST_EVENT_THANKS: 'POST_EVENT_THANKS',
};

const EMAIL_THEME = {
  black: '#000000',
  panel: '#080808',
  panelAlt: '#101010',
  white: '#ffffff',
  accent: '#99ffff',
  muted: '#a3a3a3',
  mutedDark: '#737373',
  border: '#2e2e2e',
};

function emailSiteUrl_() {
  const config = getEventConfig_();
  const configured = String(config.eventPageUrl || '').trim();
  const base = configured || prop_('SITE_URL');
  return String(base).replace(/\/+$/, '') + '/';
}

function emailAssetUrl_(path) {
  return (
    emailSiteUrl_().replace(/\/+$/, '') +
    '/' +
    String(path || '').replace(/^\/+/, '')
  );
}

const EMAIL_PUBLIC_ASSET_BASE =
  'https://nei-aauav.github.io/deti-plus-26/email/';

const EMAIL_HEADLINES = {
  "you're in.": {
    file: 'headline-youre-in.png',
    width: 310,
  },
  'waiting list.': {
    file: 'headline-waiting-list.png',
    width: 390,
  },
  'your link.': {
    file: 'headline-your-link.png',
    width: 285,
  },
  'CV received.': {
    file: 'headline-cv-received.png',
    width: 365,
  },
  'CV updated.': {
    file: 'headline-cv-updated.png',
    width: 350,
  },
  'cancelled.': {
    file: 'headline-cancelled.png',
    width: 300,
  },
  'restored.': {
    file: 'headline-restored.png',
    width: 285,
  },
  'status update.': {
    file: 'headline-status-update.png',
    width: 395,
  },
  'one week left.': {
    file: 'headline-one-week-left.png',
    width: 410,
  },
  '48 hours left.': {
    file: 'headline-48-hours-left.png',
    width: 410,
  },
  'one week to go.': {
    file: 'headline-one-week-to-go.png',
    width: 445,
  },
  'tomorrow.': {
    file: 'headline-tomorrow.png',
    width: 310,
  },
  'today.': {
    file: 'headline-today.png',
    width: 225,
  },
  'thank you.': {
    file: 'headline-thank-you.png',
    width: 300,
  },
};

function emailLogoUrl_() {
  return EMAIL_PUBLIC_ASSET_BASE + 'deti-plus-logo.png';
}

function emailHeadline_(title) {
  return EMAIL_HEADLINES[String(title || '')] || null;
}

function firstName_(name) {
  return String(name || '').trim().split(/\s+/)[0] || '';
}

function emailFormatDateShort_(date) {
  if (!date) return '';
  const config = getEventConfig_();
  return Utilities.formatDate(
    new Date(date),
    config.timezone || DEFAULT_EVENT_TIMEZONE,
    'dd MMM'
  ).toUpperCase();
}

function emailFormatDateTime_(date) {
  if (!date) return '';
  const config = getEventConfig_();
  return Utilities.formatDate(
    new Date(date),
    config.timezone || DEFAULT_EVENT_TIMEZONE,
    'dd MMM · HH:mm'
  ).toUpperCase();
}

function emailFormatTime_(date) {
  if (!date) return '';
  const config = getEventConfig_();
  return Utilities.formatDate(
    new Date(date),
    config.timezone || DEFAULT_EVENT_TIMEZONE,
    'HH:mm'
  );
}

function emailEventDateRange_() {
  const config = getEventConfig_();
  if (!config.eventStartsAt) return '';
  if (!config.eventEndsAt) return emailFormatDateShort_(config.eventStartsAt);

  const start = new Date(config.eventStartsAt);
  const end = new Date(config.eventEndsAt);
  const timezone = config.timezone || DEFAULT_EVENT_TIMEZONE;
  const startDay = Utilities.formatDate(start, timezone, 'dd');
  const endDay = Utilities.formatDate(end, timezone, 'dd');
  const startMonth = Utilities.formatDate(start, timezone, 'MMM').toUpperCase();
  const endMonth = Utilities.formatDate(end, timezone, 'MMM').toUpperCase();

  if (startMonth === endMonth) {
    return startDay + ' — ' + endDay + ' ' + endMonth;
  }

  return startDay + ' ' + startMonth + ' — ' + endDay + ' ' + endMonth;
}

function emailVenue_() {
  const config = getEventConfig_();
  return config.eventVenue || 'DETI · UNIVERSIDADE DE AVEIRO';
}

function emailCampaignCycleKey_(referenceDate) {
  const config = getEventConfig_();
  const date = referenceDate || config.eventStartsAt || new Date();
  return Utilities.formatDate(
    new Date(date),
    config.timezone || DEFAULT_EVENT_TIMEZONE,
    'yyyy'
  );
}

function emailDedupeKey_(record, templateKey, referenceDate) {
  return [
    String(record.registrationId || record.email || 'participant'),
    String(templateKey || 'EMAIL'),
    emailCampaignCycleKey_(referenceDate),
  ].join(':');
}

function buildParticipantTemplate_(templateKey, record, data) {
  data = data || {};

  const config = getEventConfig_();
  const cvLink = record && record.token ? cvLink_(record.token) : '';
  const eventLink = emailSiteUrl_();
  const eventDates = emailEventDateRange_();
  const venue = emailVenue_();
  const currentStatus = normalizedRegistrationStatus_(record);

  switch (templateKey) {
    case EMAIL_TEMPLATE.REGISTRATION_CONFIRMED:
      return {
        subject: 'DETI+ 2026 — registration confirmed',
        preheader: 'Your place at DETI+ 2026 is confirmed.',
        eyebrow: 'REGISTRATION',
        title: "you're in.",
        intro: data.cvUploaded
          ? 'Your place at DETI+ 2026 is confirmed and we have received your CV.'
          : 'Your place at DETI+ 2026 is confirmed.',
        status: 'CONFIRMED',
        statusTone: 'accent',
        facts: [
          eventDates ? { label: 'WHEN', value: eventDates } : null,
          venue ? { label: 'WHERE', value: venue } : null,
        ].filter(Boolean),
        notice: data.cvUploaded
          ? 'Your CV is already on file. You can view or replace it while CV submissions remain open.'
          : 'Your CV has not been submitted yet. Use your personal link if you want to share it with participating companies.',
        primaryAction: cvLink
          ? {
              label: data.cvUploaded ? 'MANAGE MY CV' : 'SUBMIT MY CV',
              url: cvLink,
            }
          : null,
        secondaryAction: { label: 'EVENT WEBSITE', url: eventLink },
        personalLink: Boolean(cvLink),
      };

    case EMAIL_TEMPLATE.WAITLIST_JOINED:
      return {
        subject: 'DETI+ 2026 — waiting list',
        preheader: 'You have been added to the DETI+ waiting list.',
        eyebrow: 'REGISTRATION',
        title: 'waiting list.',
        intro:
          'We received your registration. All currently available confirmed places are occupied, so you have been added to the waiting list.',
        status: 'WAITING LIST',
        statusTone: 'neutral',
        facts: [
          eventDates ? { label: 'EVENT', value: eventDates } : null,
          { label: 'STATUS', value: 'WAITING LIST' },
        ].filter(Boolean),
        notice: data.cvUploaded
          ? 'Your CV was also received. If a place becomes available, we will contact you automatically.'
          : 'If a place becomes available, we will contact you automatically. You may still submit your CV using your personal link.',
        primaryAction: cvLink
          ? {
              label: data.cvUploaded ? 'MANAGE MY CV' : 'SUBMIT MY CV',
              url: cvLink,
            }
          : null,
        secondaryAction: { label: 'EVENT WEBSITE', url: eventLink },
        personalLink: Boolean(cvLink),
      };

    case EMAIL_TEMPLATE.MAGIC_LINK:
      return {
        subject: 'DETI+ 2026 — your personal link',
        preheader: 'Your personal DETI+ registration link.',
        eyebrow: 'YOUR REGISTRATION',
        title: 'your link.',
        intro:
          currentStatus === 'waitlisted'
            ? 'You are currently on the DETI+ waiting list. Here is your personal link to view or manage your CV.'
            : 'Your registration is active. Here is your personal link to view, submit or replace your CV.',
        status: currentStatus === 'waitlisted' ? 'WAITING LIST' : 'CONFIRMED',
        statusTone: currentStatus === 'waitlisted' ? 'neutral' : 'accent',
        notice: data.cvUploaded
          ? 'The CV included with your latest submission was received successfully.'
          : '',
        primaryAction: cvLink ? { label: 'OPEN MY REGISTRATION', url: cvLink } : null,
        personalLink: Boolean(cvLink),
      };

    case EMAIL_TEMPLATE.CV_RECEIVED:
      return {
        subject: data.replaced ? 'DETI+ 2026 — CV updated' : 'DETI+ 2026 — CV received',
        preheader: data.replaced
          ? 'Your DETI+ CV was updated successfully.'
          : 'We received your CV successfully.',
        eyebrow: 'YOUR CV',
        title: data.replaced ? 'CV updated.' : 'CV received.',
        intro: data.replaced
          ? 'Your new CV has been received and replaced the previous file successfully.'
          : 'Your CV has been received successfully.',
        status: data.replaced ? 'UPDATED' : 'RECEIVED',
        statusTone: 'accent',
        facts: [
          data.filename ? { label: 'FILE', value: data.filename } : null,
          {
            label: 'REGISTRATION',
            value: currentStatus === 'waitlisted' ? 'WAITING LIST' : 'CONFIRMED',
          },
        ].filter(Boolean),
        notice:
          'You can replace this file using the same personal link while CV submissions remain open.',
        primaryAction: cvLink ? { label: 'VIEW / REPLACE CV', url: cvLink } : null,
        personalLink: Boolean(cvLink),
      };

    case EMAIL_TEMPLATE.WAITLIST_PROMOTED:
      return {
        subject: 'DETI+ 2026 — your place is confirmed',
        preheader: 'A place became available. You are now confirmed for DETI+ 2026.',
        eyebrow: 'WAITING LIST',
        title: "you're in.",
        intro:
          'A place became available and your registration for DETI+ 2026 is now confirmed.',
        status: 'CONFIRMED',
        statusTone: 'accent',
        facts: [
          eventDates ? { label: 'WHEN', value: eventDates } : null,
          venue ? { label: 'WHERE', value: venue } : null,
        ].filter(Boolean),
        notice: record.cvFileId
          ? 'Your CV remains associated with your registration.'
          : 'If you want to share your CV with participating companies, you can submit it using your personal link.',
        primaryAction: cvLink
          ? {
              label: record.cvFileId ? 'MANAGE MY CV' : 'SUBMIT MY CV',
              url: cvLink,
            }
          : null,
        secondaryAction: { label: 'EVENT WEBSITE', url: eventLink },
        personalLink: Boolean(cvLink),
      };

    case EMAIL_TEMPLATE.REGISTRATION_CANCELLED:
      return {
        subject: 'DETI+ 2026 — registration cancelled',
        preheader: 'Your DETI+ registration has been cancelled.',
        eyebrow: 'REGISTRATION',
        title: 'cancelled.',
        intro: 'Your registration for DETI+ 2026 has been cancelled.',
        status: 'CANCELLED',
        statusTone: 'neutral',
        notice:
          'If you believe this was a mistake or need assistance, reply directly to this email.',
        secondaryAction: { label: 'EVENT WEBSITE', url: eventLink },
        personalLink: false,
      };

    case EMAIL_TEMPLATE.REGISTRATION_RESTORED:
      return {
        subject:
          data.status === 'waitlisted'
            ? 'DETI+ 2026 — registration restored to waiting list'
            : 'DETI+ 2026 — registration restored',
        preheader: 'Your DETI+ registration has been restored.',
        eyebrow: 'REGISTRATION',
        title: 'restored.',
        intro:
          data.status === 'waitlisted'
            ? 'Your DETI+ registration has been restored. Because all confirmed places are currently occupied, you have been returned to the waiting list.'
            : 'Your DETI+ registration has been restored and your place is confirmed.',
        status: data.status === 'waitlisted' ? 'WAITING LIST' : 'CONFIRMED',
        statusTone: data.status === 'waitlisted' ? 'neutral' : 'accent',
        primaryAction: cvLink ? { label: 'OPEN MY REGISTRATION', url: cvLink } : null,
        personalLink: Boolean(cvLink),
      };

    case EMAIL_TEMPLATE.MOVED_TO_WAITLIST:
      return {
        subject: 'DETI+ 2026 — registration status updated',
        preheader: 'Your DETI+ registration status has changed.',
        eyebrow: 'REGISTRATION',
        title: 'status update.',
        intro:
          'Your registration status has been updated and you are now on the DETI+ waiting list.',
        status: 'WAITING LIST',
        statusTone: 'neutral',
        notice:
          'If a confirmed place becomes available, we will contact you automatically.',
        primaryAction: cvLink ? { label: 'OPEN MY REGISTRATION', url: cvLink } : null,
        personalLink: Boolean(cvLink),
      };

    case EMAIL_TEMPLATE.CV_REMINDER_7D:
      return {
        subject: 'DETI+ 2026 — don’t forget your CV',
        preheader: 'The CV submission deadline is approaching.',
        eyebrow: 'YOUR CV',
        title: 'one week left.',
        intro:
          'Your registration is confirmed, but we have not received your CV yet.',
        facts: config.cvDeadline
          ? [{ label: 'CV DEADLINE', value: emailFormatDateTime_(config.cvDeadline) }]
          : [],
        notice:
          'Submitting a CV allows participating companies to access it for recruitment and career opportunities, according to the consent provided during registration.',
        primaryAction: cvLink ? { label: 'SUBMIT MY CV', url: cvLink } : null,
        personalLink: Boolean(cvLink),
      };

    case EMAIL_TEMPLATE.CV_REMINDER_48H:
      return {
        subject: 'DETI+ 2026 — 48 hours left to submit your CV',
        preheader: 'CV submissions close in approximately 48 hours.',
        eyebrow: 'YOUR CV',
        title: '48 hours left.',
        intro: 'We still have not received a CV associated with your registration.',
        facts: config.cvDeadline
          ? [{ label: 'DEADLINE', value: emailFormatDateTime_(config.cvDeadline) }]
          : [],
        primaryAction: cvLink ? { label: 'SUBMIT MY CV', url: cvLink } : null,
        personalLink: Boolean(cvLink),
      };

    case EMAIL_TEMPLATE.EVENT_REMINDER_7D:
      return {
        subject: 'DETI+ 2026 — one week to go',
        preheader: 'DETI+ starts in one week.',
        eyebrow: 'DETI+ 2026',
        title: 'one week to go.',
        intro: 'Your place is confirmed. DETI+ 2026 starts in one week.',
        status: 'CONFIRMED',
        statusTone: 'accent',
        facts: [
          eventDates ? { label: 'WHEN', value: eventDates } : null,
          venue ? { label: 'WHERE', value: venue } : null,
        ].filter(Boolean),
        notice:
          'Get ready to meet companies, discover internships and job opportunities, and connect directly with the professional world.',
        primaryAction: { label: 'VIEW EVENT WEBSITE', url: eventLink },
        secondaryAction: cvLink ? { label: 'CHECK MY CV', url: cvLink } : null,
        personalLink: false,
      };

    case EMAIL_TEMPLATE.EVENT_REMINDER_24H:
      return {
        subject: 'DETI+ 2026 — tomorrow',
        preheader: 'DETI+ starts tomorrow.',
        eyebrow: 'DETI+ 2026',
        title: 'tomorrow.',
        intro: 'DETI+ starts tomorrow. Your registration is confirmed.',
        status: 'CONFIRMED',
        statusTone: 'accent',
        facts: [
          config.eventStartsAt
            ? { label: 'START', value: emailFormatDateTime_(config.eventStartsAt) }
            : null,
          venue ? { label: 'WHERE', value: venue } : null,
        ].filter(Boolean),
        notice:
          'Before you arrive, check the latest event information and make sure your CV is up to date if you submitted one.',
        primaryAction: { label: 'EVENT INFORMATION', url: eventLink },
        secondaryAction: cvLink ? { label: 'CHECK MY CV', url: cvLink } : null,
        personalLink: false,
      };

    case EMAIL_TEMPLATE.EVENT_DAY:
      return {
        subject: 'DETI+ 2026 — today',
        preheader: 'DETI+ starts today. See you at DETI.',
        eyebrow: 'DETI+ 2026',
        title: 'today.',
        intro: 'DETI+ 2026 starts today. See you there.',
        facts: [
          config.eventStartsAt
            ? { label: 'START', value: emailFormatTime_(config.eventStartsAt) }
            : null,
          venue ? { label: 'LOCATION', value: venue } : null,
        ].filter(Boolean),
        primaryAction: { label: 'OPEN EVENT WEBSITE', url: eventLink },
        personalLink: false,
      };

    case EMAIL_TEMPLATE.WAITLIST_EVENT_UPDATE:
      return {
        subject: 'DETI+ 2026 — waiting list update',
        preheader: 'An update about your place on the DETI+ waiting list.',
        eyebrow: 'WAITING LIST',
        title: 'status update.',
        intro:
          'You are still on the DETI+ waiting list and do not currently have a confirmed place.',
        status: 'WAITING LIST',
        statusTone: 'neutral',
        notice:
          'If a place becomes available, we will notify you automatically by email.',
        secondaryAction: { label: 'EVENT WEBSITE', url: eventLink },
        personalLink: false,
      };

    case EMAIL_TEMPLATE.POST_EVENT_THANKS:
      return {
        subject: 'DETI+ 2026 — thank you',
        preheader: 'Thank you for being part of DETI+ 2026.',
        eyebrow: 'DETI+ 2026',
        title: 'thank you.',
        intro:
          'Thank you for being part of DETI+ 2026 and helping bring students and companies closer together.',
        facts: [{ label: '03 DAYS', value: 'STUDENTS · COMPANIES · FUTURE' }],
        notice:
          'We hope the event helped you discover new companies, opportunities and connections.',
        secondaryAction: { label: 'DETI+ WEBSITE', url: eventLink },
        personalLink: false,
      };

    default:
      throw new Error('Unknown participant email template: ' + templateKey);
  }
}

function renderParticipantEmail_(record, template) {
  const firstName = escapeHtml_(firstName_(record && record.name));

  const headline =
    emailHeadline_(
      template.title
    );

  const headlineHtml =
    headline
      ? [
          '<img class="email-headline" src="',
          escapeHtml_(EMAIL_PUBLIC_ASSET_BASE + headline.file),
          '" width="',
          String(headline.width),
          '" alt="',
          escapeHtml_(template.title || ''),
          '" style="display:block;width:',
          String(headline.width),
          'px;max-width:100%;height:auto;border:0;margin:0 0 30px 0;">',
        ].join('')
      : [
          '<div style="font-family:Helvetica,Arial,sans-serif;',
          'font-size:50px;line-height:1;font-weight:700;letter-spacing:-2px;',
          'color:',
          EMAIL_THEME.white,
          ';margin:0 0 30px 0;">',
          escapeHtml_(template.title || ''),
          '</div>',
        ].join('');
  const accent = EMAIL_THEME.accent;
  const statusColour =
    template.statusTone === 'accent' ? EMAIL_THEME.accent : EMAIL_THEME.white;
  const facts = template.facts || [];

  const factCells = facts.map(function (fact) {
    return [
      '<td valign="top" style="width:50%;padding:18px;border:1px solid ',
      EMAIL_THEME.border,
      ';">',
      '<div style="font-family:\'Vayu Sans\',Arial,Helvetica,sans-serif;font-size:10px;',
      'line-height:1.4;letter-spacing:1.6px;font-weight:600;color:',
      EMAIL_THEME.muted,
      ';text-transform:uppercase;margin-bottom:7px;">',
      escapeHtml_(fact.label || ''),
      '</div>',
      '<div style="font-family:\'Architype Stedelijk\',\'Arial Narrow\',Arial,sans-serif;',
      'font-size:16px;line-height:1.35;letter-spacing:0;font-weight:600;color:',
      EMAIL_THEME.white,
      ';text-transform:uppercase;">',
      escapeHtml_(fact.value || ''),
      '</div>',
      '</td>',
    ].join('');
  });

  let factsHtml = '';
  if (factCells.length) {
    const rows = [];
    for (let i = 0; i < factCells.length; i += 2) {
      rows.push(
        '<tr>' +
          factCells[i] +
          (factCells[i + 1] ||
            '<td style="width:50%;border:1px solid ' + EMAIL_THEME.border + ';"></td>') +
          '</tr>'
      );
    }

    factsHtml = [
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" ',
      'style="border-collapse:collapse;margin:28px 0;">',
      rows.join(''),
      '</table>',
    ].join('');
  }

  let statusHtml = '';
  if (template.status) {
    statusHtml = [
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" ',
      'style="border-collapse:collapse;margin:26px 0;">',
      '<tr><td style="border-left:4px solid ',
      statusColour,
      ';background:',
      EMAIL_THEME.panelAlt,
      ';padding:16px 18px;">',
      '<div style="font-family:\'Vayu Sans\',Arial,Helvetica,sans-serif;font-size:9px;',
      'letter-spacing:1.8px;font-weight:600;color:',
      EMAIL_THEME.muted,
      ';text-transform:uppercase;margin-bottom:5px;">STATUS</div>',
      '<div style="font-family:\'Architype Stedelijk\',\'Arial Narrow\',Arial,sans-serif;',
      'font-size:18px;line-height:1.3;letter-spacing:.2px;font-weight:600;color:',
      statusColour,
      ';text-transform:uppercase;">',
      escapeHtml_(template.status),
      '</div></td></tr></table>',
    ].join('');
  }

  function buttonHtml_(action, primary) {
    if (!action || !action.url) return '';

    return [
      '<table role="presentation" cellspacing="0" cellpadding="0" border="0" ',
      'style="border-collapse:collapse;',
      primary ? 'margin:0 0 12px 0;' : 'margin:0;',
      '"><tr><td bgcolor="',
      primary ? accent : EMAIL_THEME.black,
      '" style="border:2px solid ',
      primary ? accent : EMAIL_THEME.border,
      ';"><a href="',
      escapeHtml_(action.url),
      '" target="_blank" style="display:inline-block;padding:14px 20px;',
      'font-family:'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif;',
      'font-size:13px;line-height:1;letter-spacing:1.2px;font-weight:700;text-transform:uppercase;',
      'text-decoration:none;color:',
      primary ? EMAIL_THEME.black : EMAIL_THEME.white,
      ';">',
      escapeHtml_(action.label || 'OPEN'),
      '&nbsp;&nbsp;→</a></td></tr></table>',
    ].join('');
  }

  const primaryButton = buttonHtml_(template.primaryAction, true);
  const secondaryButton = buttonHtml_(template.secondaryAction, false);

  const noticeHtml = template.notice
    ? [
        '<div style="margin-top:28px;padding:18px;border:1px solid ',
        EMAIL_THEME.border,
        ';background:',
        EMAIL_THEME.panel,
        ';"><p style="margin:0;font-family:\'Vayu Sans\',Arial,Helvetica,sans-serif;',
        'font-size:13px;line-height:1.65;color:',
        EMAIL_THEME.muted,
        ';">',
        escapeHtml_(template.notice),
        '</p></div>',
      ].join('')
    : '';

  const personalLinkHtml = template.personalLink
    ? [
        '<p style="margin:22px 0 0;font-family:\'Vayu Sans\',Arial,Helvetica,sans-serif;',
        'font-size:11px;line-height:1.6;color:',
        EMAIL_THEME.mutedDark,
        ';">This link is personal to your registration. Do not share it with other people.</p>',
      ].join('')
    : '';

  return [
    '<!doctype html><html><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<style>',
    'body{margin:0!important;padding:0!important;background:#000000!important;}',
    '@media only screen and (max-width:620px){.email-shell{width:100%!important;}',
    '.email-pad{padding-left:22px!important;padding-right:22px!important;}',
    '.email-headline{max-width:100%!important;height:auto!important;}}',
    '</style></head><body style="margin:0;padding:0;background:',
    EMAIL_THEME.black,
    ';">',
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">',
    escapeHtml_(template.preheader || ''),
    '</div>',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" ',
    'style="width:100%;background:',
    EMAIL_THEME.black,
    ';border-collapse:collapse;"><tr><td align="center" style="padding:34px 14px 50px;">',
    '<table role="presentation" class="email-shell" width="600" cellspacing="0" cellpadding="0" border="0" ',
    'style="width:600px;max-width:600px;border-collapse:collapse;background:',
    EMAIL_THEME.black,
    ';border:1px solid ',
    EMAIL_THEME.border,
    ';">',

    '<tr><td class="email-pad" style="padding:28px 34px 26px;border-bottom:1px solid ',
    EMAIL_THEME.border,
    ';"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>',
    '<td valign="middle"><img src="',
    escapeHtml_(emailLogoUrl_()),
    '" width="150" alt="DETI+" style="display:block;width:150px;max-width:150px;height:auto;border:0;"></td>',
    '<td align="right" valign="middle"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>',
    '<td style="width:16px;height:16px;background:',
    EMAIL_THEME.white,
    ';font-size:0;line-height:0;">&nbsp;</td>',
    '<td style="width:5px;font-size:0;line-height:0;">&nbsp;</td>',
    '<td style="width:16px;height:16px;background:',
    EMAIL_THEME.accent,
    ';font-size:0;line-height:0;">&nbsp;</td>',
    '</tr></table></td></tr></table></td></tr>',

    '<tr><td class="email-pad" style="padding:38px 34px 40px;">',
    '<div style="font-family:\'Vayu Sans\',Arial,Helvetica,sans-serif;font-size:10px;',
    'line-height:1.4;letter-spacing:2.2px;font-weight:600;text-transform:uppercase;color:',
    accent,
    ';margin-bottom:16px;">',
    escapeHtml_(template.eyebrow || 'DETI+ 2026'),
    '</div>',
    headlineHtml,
    '<p style="margin:0 0 15px;font-family:\'Vayu Sans\',Arial,Helvetica,sans-serif;',
    'font-size:15px;line-height:1.65;font-weight:400;color:',
    EMAIL_THEME.white,
    ';">',
    firstName ? 'hi ' + firstName + ',' : 'hi,',
    '</p>',
    '<p style="margin:0;font-family:\'Vayu Sans\',Arial,Helvetica,sans-serif;',
    'font-size:15px;line-height:1.7;font-weight:400;color:',
    EMAIL_THEME.muted,
    ';">',
    escapeHtml_(template.intro || ''),
    '</p>',
    statusHtml,
    factsHtml,
    noticeHtml,
    primaryButton || secondaryButton
      ? '<div style="margin-top:30px;">' + primaryButton + secondaryButton + '</div>'
      : '',
    personalLinkHtml,
    '</td></tr>',

    '<tr><td class="email-pad" style="padding:22px 34px;border-top:1px solid ',
    EMAIL_THEME.border,
    ';background:',
    EMAIL_THEME.panel,
    ';"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>',
    '<td valign="top"><div style="font-family:\'Architype Stedelijk\',\'Arial Narrow\',Arial,sans-serif;',
    'font-size:14px;letter-spacing:1.2px;text-transform:uppercase;color:',
    EMAIL_THEME.white,
    ';">DETI+ 2026</div>',
    '<div style="margin-top:6px;font-family:\'Vayu Sans\',Arial,Helvetica,sans-serif;',
    'font-size:10px;line-height:1.6;color:',
    EMAIL_THEME.mutedDark,
    ';">Universidade de Aveiro<br>NEEETA · NEI · NEECT</div></td>',
    '<td align="right" valign="bottom"><span style="font-family:\'Architype Stedelijk\',Arial,sans-serif;',
    'font-size:18px;color:',
    accent,
    ';">+</span></td></tr></table></td></tr>',
    '</table></td></tr></table></body></html>',
  ].join('');
}

function renderParticipantTextEmail_(record, template) {
  const lines = ['DETI+ 2026', ''];

  if (template.eyebrow) lines.push(String(template.eyebrow).toUpperCase());
  if (template.title) lines.push(template.title);

  lines.push('');
  const name = firstName_(record && record.name);
  lines.push(name ? 'Hi ' + name + ',' : 'Hi,');
  lines.push('');
  lines.push(template.intro || '');

  if (template.status) {
    lines.push('');
    lines.push('STATUS: ' + template.status);
  }

  (template.facts || []).forEach(function (fact) {
    lines.push('');
    lines.push(fact.label + ': ' + fact.value);
  });

  if (template.notice) {
    lines.push('');
    lines.push(template.notice);
  }

  if (template.primaryAction && template.primaryAction.url) {
    lines.push('');
    lines.push(template.primaryAction.label);
    lines.push(template.primaryAction.url);
  }

  if (template.secondaryAction && template.secondaryAction.url) {
    lines.push('');
    lines.push(template.secondaryAction.label);
    lines.push(template.secondaryAction.url);
  }

  if (template.personalLink) {
    lines.push('');
    lines.push('This link is personal to your registration. Do not share it.');
  }

  lines.push('');
  lines.push('DETI+ 2026 · Universidade de Aveiro');
  lines.push('NEEETA · NEI · NEECT');
  return lines.join('\n');
}

function sendParticipantTemplate_(templateKey, record, data, options) {
  options = options || {};

  if (!record || !record.email) {
    console.warn('Could not queue participant email: missing recipient.');
    return false;
  }

  try {
    const template = buildParticipantTemplate_(templateKey, record, data || {});
    const queued = queueParticipantEmail_({
      recipient: record.email,
      subject: template.subject,
      textBody: renderParticipantTextEmail_(record, template),
      htmlBody: renderParticipantEmail_(record, template),
      replyTo: prop_('EVENT_EMAIL'),
      type: templateKey,
      templateKey: templateKey,
      dedupeKey: options.dedupeKey || '',
      registrationId: record.registrationId || '',
      sendAfter: options.sendAfter || new Date(),
      skipDedupeLookup: Boolean(options.skipDedupeLookup),
    });

    if (queued === false) return false;

    // Transactional messages must not wait for the scheduled queue worker.
    // If Gmail rejects the send, attemptQueuedEmail_ records the failure and
    // leaves it pending for the normal retry flow.
    attemptQueuedEmail_(queued.sheet, queued.row, queued.record);

    return true;
  } catch (err) {
    console.warn('Could not queue participant email (' + templateKey + '): ' + err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// Transactional wrappers
// -----------------------------------------------------------------------------

function sendMagicLink_(record, opts) {
  const options = opts || {};
  const registrationStatus =
    options.registrationStatus || normalizedRegistrationStatus_(record);

  let templateKey;
  if (options.returning) {
    templateKey = EMAIL_TEMPLATE.MAGIC_LINK;
  } else if (registrationStatus === 'waitlisted') {
    templateKey = EMAIL_TEMPLATE.WAITLIST_JOINED;
  } else {
    templateKey = EMAIL_TEMPLATE.REGISTRATION_CONFIRMED;
  }

  return sendParticipantTemplate_(templateKey, record, {
    cvUploaded: Boolean(options.cvUploaded),
  });
}

function sendCvConfirmation_(record, filename, replaced) {
  return sendParticipantTemplate_(EMAIL_TEMPLATE.CV_RECEIVED, record, {
    filename: filename,
    replaced: Boolean(replaced),
  });
}

function sendPromotionEmail_(record) {
  return sendParticipantTemplate_(EMAIL_TEMPLATE.WAITLIST_PROMOTED, record);
}

function sendCancellationEmail_(record) {
  return sendParticipantTemplate_(EMAIL_TEMPLATE.REGISTRATION_CANCELLED, record);
}

function sendRestorationEmail_(record, status) {
  return sendParticipantTemplate_(EMAIL_TEMPLATE.REGISTRATION_RESTORED, record, {
    status: status || normalizedRegistrationStatus_(record),
  });
}

function sendMovedToWaitlistEmail_(record) {
  return sendParticipantTemplate_(EMAIL_TEMPLATE.MOVED_TO_WAITLIST, record);
}

// -----------------------------------------------------------------------------
// Scheduled communication lifecycle
// -----------------------------------------------------------------------------

function scheduleParticipantCommunications() {
  const config = getEventConfig_();

  if (!config.emailRemindersEnabled) {
    return { queued: 0, reason: 'disabled' };
  }

  const now = new Date();
  const rows = readRecords_(getSheet_());
  const dedupeSet = getEmailQueueDedupeSet_();
  let queued = 0;

  rows.forEach(function (entry) {
    const record = entry.record;
    if (!record.email || !record.registrationId) return;

    const status = normalizedRegistrationStatus_(record);
    if (status === 'cancelled') return;

    if (
      status === 'confirmed' &&
      !record.cvFileId &&
      config.cvUploadsEnabled &&
      config.cvDeadline &&
      now.getTime() < config.cvDeadline.getTime()
    ) {
      queued += scheduleTemplateInWindow_(
        EMAIL_TEMPLATE.CV_REMINDER_7D,
        record,
        dateMinus_(config.cvDeadline, 7 * 24 * 60 * 60 * 1000),
        dateMinus_(config.cvDeadline, 4 * 24 * 60 * 60 * 1000),
        now,
        config.cvDeadline,
        dedupeSet
      );

      queued += scheduleTemplateInWindow_(
        EMAIL_TEMPLATE.CV_REMINDER_48H,
        record,
        dateMinus_(config.cvDeadline, 48 * 60 * 60 * 1000),
        dateMinus_(config.cvDeadline, 6 * 60 * 60 * 1000),
        now,
        config.cvDeadline,
        dedupeSet
      );
    }

    if (!config.eventStartsAt) return;

    if (status === 'confirmed') {
      queued += scheduleTemplateInWindow_(
        EMAIL_TEMPLATE.EVENT_REMINDER_7D,
        record,
        dateMinus_(config.eventStartsAt, 7 * 24 * 60 * 60 * 1000),
        dateMinus_(config.eventStartsAt, 4 * 24 * 60 * 60 * 1000),
        now,
        config.eventStartsAt,
        dedupeSet
      );

      queued += scheduleTemplateInWindow_(
        EMAIL_TEMPLATE.EVENT_REMINDER_24H,
        record,
        dateMinus_(config.eventStartsAt, 26 * 60 * 60 * 1000),
        dateMinus_(config.eventStartsAt, 6 * 60 * 60 * 1000),
        now,
        config.eventStartsAt,
        dedupeSet
      );

      queued += scheduleTemplateInWindow_(
        EMAIL_TEMPLATE.EVENT_DAY,
        record,
        startOfEventDay_(config.eventStartsAt, config.timezone),
        datePlus_(config.eventStartsAt, 6 * 60 * 60 * 1000),
        now,
        config.eventStartsAt,
        dedupeSet
      );
    }

    if (status === 'waitlisted') {
      queued += scheduleTemplateInWindow_(
        EMAIL_TEMPLATE.WAITLIST_EVENT_UPDATE,
        record,
        dateMinus_(config.eventStartsAt, 48 * 60 * 60 * 1000),
        dateMinus_(config.eventStartsAt, 12 * 60 * 60 * 1000),
        now,
        config.eventStartsAt,
        dedupeSet
      );
    }

    if (config.eventEndsAt && isRecordCheckedIn_(record)) {
      queued += scheduleTemplateInWindow_(
        EMAIL_TEMPLATE.POST_EVENT_THANKS,
        record,
        datePlus_(config.eventEndsAt, 12 * 60 * 60 * 1000),
        datePlus_(config.eventEndsAt, 4 * 24 * 60 * 60 * 1000),
        now,
        config.eventEndsAt,
        dedupeSet
      );
    }
  });

  return { queued: queued };
}

function scheduleTemplateInWindow_(
  templateKey,
  record,
  opensAt,
  expiresAt,
  now,
  referenceDate,
  dedupeSet
) {
  if (!opensAt || !expiresAt) return 0;

  const current = now.getTime();
  if (current < opensAt.getTime() || current >= expiresAt.getTime()) return 0;

  const dedupeKey = emailDedupeKey_(record, templateKey, referenceDate);
  const known = dedupeSet || getEmailQueueDedupeSet_();
  if (known.has(dedupeKey)) return 0;

  const queued = sendParticipantTemplate_(templateKey, record, {}, {
    dedupeKey: dedupeKey,
    skipDedupeLookup: true,
  });

  if (queued) known.add(dedupeKey);
  return queued ? 1 : 0;
}

function dateMinus_(value, milliseconds) {
  return new Date(new Date(value).getTime() - milliseconds);
}

function datePlus_(value, milliseconds) {
  return new Date(new Date(value).getTime() + milliseconds);
}

function startOfEventDay_(eventDate, timezone) {
  const value = new Date(eventDate);
  const zone = timezone || DEFAULT_EVENT_TIMEZONE;
  const hours = Number(Utilities.formatDate(value, zone, 'H'));
  const minutes = Number(Utilities.formatDate(value, zone, 'm'));

  return new Date(value.getTime() - (hours * 60 + minutes) * 60 * 1000);
}

// -----------------------------------------------------------------------------
// Preview helper
// -----------------------------------------------------------------------------

function sendParticipantEmailPreview() {
  const recipient = prop_('EVENT_EMAIL');
  if (!recipient) throw new Error('EVENT_EMAIL is not configured.');

  const sample = {
    registrationId: 'PREVIEW-001',
    name: 'Martim Preview',
    email: recipient,
    token: 'preview-token',
    registrationStatus: 'confirmed',
    cvStatus: 'none',
    cvFileId: '',
    checkedIn: false,
  };

  const queued = sendParticipantTemplate_(
    EMAIL_TEMPLATE.REGISTRATION_CONFIRMED,
    sample,
    { cvUploaded: false }
  );

  return queued ? 'Preview queued for ' + recipient : 'Preview could not be queued.';
}
