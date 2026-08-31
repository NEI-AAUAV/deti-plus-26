 /**
  * DETI+ 2026 - event configuration
  *
  * Public/event configuration is stored in the "Settings" sheet.
  * Technical secrets and infrastructure identifiers remain in Script Properties.
  */

 const SETTINGS_SHEET_NAME = 'Settings';

 const DEFAULT_EVENT_TIMEZONE = 'Europe/Lisbon';

 const SETTINGS_DEFINITIONS = [
   {
     key: 'registrationEnabled',
     defaultValue: true,
     description: 'Master switch for event registrations.',
     type: 'boolean',
   },
   {
     key: 'registrationOpensAt',
     defaultValue: '',
     description: 'Date and time when registrations open. Empty = no opening restriction.',
     type: 'date',
   },
   {
     key: 'registrationClosesAt',
     defaultValue: '',
     description: 'Date and time when registrations close. Empty = no closing restriction.',
     type: 'date',
   },
   {
     key: 'maxRegistrations',
     defaultValue: 0,
     description: 'Maximum number of confirmed registrations. 0 = unlimited.',
     type: 'number',
   },
   {
     key: 'waitlistEnabled',
     defaultValue: false,
     description: 'Allow new registrations to enter a waiting list when capacity is reached.',
     type: 'boolean',
   },
   {
     key: 'maxWaitlist',
     defaultValue: 0,
     description: 'Maximum number of people on the waiting list. 0 = unlimited.',
     type: 'number',
   },
   {
     key: 'cvUploadsEnabled',
     defaultValue: true,
     description: 'Allow participants to upload and replace their CV.',
     type: 'boolean',
   },
   {
     key: 'cvDeadline',
     defaultValue: '',
     description: 'Deadline for CV uploads. Empty = no deadline.',
     type: 'date',
   },
   {
     key: 'eventName',
     defaultValue: 'DETI+ 2026',
     description: 'Public event name.',
     type: 'text',
   },
   {
     key: 'timezone',
     defaultValue: DEFAULT_EVENT_TIMEZONE,
     description: 'Timezone used for event dates and operational information.',
     type: 'text',
   },
 ];

 /**
  * Returns the complete event configuration.
  */
 function getEventConfig_() {
   const settings = getSettingsMap_();

   return {
     registrationEnabled: settingBoolean_(
       settings.registrationEnabled,
       true
     ),

     registrationOpensAt: settingDate_(
       settings.registrationOpensAt
     ),

     registrationClosesAt: settingDate_(
       settings.registrationClosesAt
     ),

     maxRegistrations: settingNonNegativeInteger_(
       settings.maxRegistrations,
       0
     ),

     waitlistEnabled: settingBoolean_(
       settings.waitlistEnabled,
       false
     ),

     maxWaitlist: settingNonNegativeInteger_(
       settings.maxWaitlist,
       0
     ),

     cvUploadsEnabled: settingBoolean_(
       settings.cvUploadsEnabled,
       true
     ),

     cvDeadline: settingDate_(
       settings.cvDeadline
     ),

     eventName: settingText_(
       settings.eventName,
       'DETI+ 2026'
     ),

     timezone: settingText_(
       settings.timezone,
       DEFAULT_EVENT_TIMEZONE
     ),
   };
 }

 /**
  * Calculates the current registration availability.
  *
  * This function is used both by:
  *
  * - the public registration_status endpoint;
  * - handleRegister_(), inside the ScriptLock.
  *
  * Therefore the backend and frontend share the same source of truth.
  */
 function getRegistrationState_() {
   const config = getEventConfig_();
   const counts = getRegistrationCounts_();
   const now = new Date();

   const capacity = config.maxRegistrations;
   const hasCapacityLimit = capacity > 0;

   let remaining = null;
   let percentage = null;

   if (hasCapacityLimit) {
     remaining = Math.max(
       capacity - counts.registered,
       0
     );

     percentage = Math.min(
       (counts.registered / capacity) * 100,
       100
     );
   }

   let state = 'open';

   if (!config.registrationEnabled) {
     state = 'disabled';
   } else if (
     config.registrationOpensAt &&
     now.getTime() < config.registrationOpensAt.getTime()
   ) {
     state = 'not_started';
   } else if (
     config.registrationClosesAt &&
     now.getTime() >= config.registrationClosesAt.getTime()
   ) {
     state = 'closed';
   } else if (
     hasCapacityLimit &&
     counts.registered >= capacity
   ) {
     const waitlistHasSpace =
       config.waitlistEnabled &&
       (
         config.maxWaitlist === 0 ||
         counts.waitlisted < config.maxWaitlist
       );

     state = waitlistHasSpace
       ? 'waitlist'
       : 'full';
   } else if (
     hasCapacityLimit &&
     counts.registered / capacity >= 0.9
   ) {
     state = 'almost_full';
   }

   return {
     state: state,

     opensAt: config.registrationOpensAt
       ? config.registrationOpensAt.toISOString()
       : null,

     closesAt: config.registrationClosesAt
       ? config.registrationClosesAt.toISOString()
       : null,

     capacity: capacity,

     registered: counts.registered,

     waitlisted: counts.waitlisted,

     remaining: remaining,

     percentage: percentage === null
       ? null
       : Math.round(percentage * 10) / 10,

     waitlistEnabled: config.waitlistEnabled,

     maxWaitlist: config.maxWaitlist,

     eventName: config.eventName,
   };
 }

 /**
  * Public registration status endpoint.
  *
  * Only aggregate/non-sensitive information is exposed.
  */
 function handleRegistrationStatus_() {
   return ok_(
     getRegistrationState_()
   );
 }

 /**
  * Decides what should happen to a NEW registration.
  *
  * Existing registrations are handled before this function is used.
  */
 function getRegistrationAdmission_(availability) {
   switch (availability.state) {
     case 'open':
     case 'almost_full':
       return {
         allowed: true,
         registrationStatus: 'confirmed',
         storedState: 'registered',
       };

     case 'waitlist':
       return {
         allowed: true,
         registrationStatus: 'waitlisted',
         storedState: 'waitlisted',
       };

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

 /**
  * Converts the legacy/current sheet state into the public concept of
  * confirmed vs waitlisted.
  *
  * CV delivery is intentionally NOT treated as a registration status.
  */
 function registrationStatusFromRecord_(record) {
   const state = String(
     record && record.state
       ? record.state
       : ''
   )
     .trim()
     .toLowerCase();

   if (state === 'waitlisted') {
     return 'waitlisted';
   }

   return 'confirmed';
 }

 /**
  * Counts registrations using the current Registration sheet.
  *
  * Current confirmed states:
  *
  * - registered
  * - cv_delivered
  *
  * Waitlisted participants do not consume event capacity.
  * Cancelled participants consume neither capacity nor waitlist.
  */
 function getRegistrationCounts_() {
   const sheet = getSheet_();
   const rows = readRecords_(sheet);

   let registered = 0;
   let waitlisted = 0;

   rows.forEach(function (entry) {
     const record = entry.record;

     // Ignore completely empty rows defensively.
     if (
       !String(record.email || '').trim() &&
       !String(record.token || '').trim()
     ) {
       return;
     }

     const state = String(record.state || '')
       .trim()
       .toLowerCase();

     if (state === 'cancelled') {
       return;
     }

     if (state === 'waitlisted') {
       waitlisted++;
       return;
     }

     // Backwards compatibility:
     // registered, cv_delivered and legacy rows without a state
     // are all considered confirmed.
     registered++;
   });

   return {
     registered: registered,
     waitlisted: waitlisted,
   };
 }

 // -----------------------------------------------------------------------------
 // Setting parsers
 // -----------------------------------------------------------------------------

 function settingBoolean_(value, fallback) {
   if (typeof value === 'boolean') {
     return value;
   }

   const normalized = String(
     value == null
       ? ''
       : value
   )
     .trim()
     .toLowerCase();

   if (
     normalized === 'true' ||
     normalized === 'yes' ||
     normalized === '1'
   ) {
     return true;
   }

   if (
     normalized === 'false' ||
     normalized === 'no' ||
     normalized === '0'
   ) {
     return false;
   }

   return fallback;
 }

 function settingNonNegativeInteger_(value, fallback) {
   if (
     value === '' ||
     value === null ||
     typeof value === 'undefined'
   ) {
     return fallback;
   }

   const parsed = Number(value);

   if (
     !Number.isFinite(parsed) ||
     parsed < 0
   ) {
     return fallback;
   }

   return Math.floor(parsed);
 }

 function settingDate_(value) {
   if (
     value === '' ||
     value === null ||
     typeof value === 'undefined'
   ) {
     return null;
   }

   if (value instanceof Date) {
     if (Number.isNaN(value.getTime())) {
       return null;
     }

     return value;
   }

   const parsed = new Date(value);

   if (Number.isNaN(parsed.getTime())) {
     return null;
   }

   return parsed;
 }

 function settingText_(value, fallback) {
   const text = String(
     value == null
       ? ''
       : value
   ).trim();

   return text || fallback;
 }
