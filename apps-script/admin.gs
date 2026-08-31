/**
 * DETI+ 2026 - Google Sheets administration
 *
 * Phase 4 contains read-only / non-destructive operational tools.
 */

// -----------------------------------------------------------------------------
// Spreadsheet menu
// -----------------------------------------------------------------------------

function onOpen() {
  // This project is standalone, so a custom menu is not guaranteed to be
  // available in the target spreadsheet. Keep this function harmless.
}

// -----------------------------------------------------------------------------
// Manual actions
// -----------------------------------------------------------------------------

function refreshControlCenterFromMenu() {
  try {
    const result =
      refreshControlCenter_();

    console.log(
      [
        'DETI+ dashboard refreshed.',
        'Confirmed: ' +
          result.registered,
        'Waitlist: ' +
          result.waitlisted,
        'CVs: ' +
          result.cvs,
      ].join(' ')
    );

    return result;
  } catch (err) {
    console.error(
      err &&
      err.stack
        ? err.stack
        : err
    );

    throw err;
  }
}

function initializeControlCenterFromMenu() {
  try {
    /*
     * Ensure all core sheets exist first.
     */
    const registration =
      getSheet_();

    getSettingsSheet_();

    getOrCreateSheet_(
      STATISTICS_SHEET_NAME
    );

    getOrCreateSheet_(
      DASHBOARD_SHEET_NAME
    );

    formatRegistrationSheet_(
      registration
    );

    const result =
      refreshControlCenter_();

    console.log(
      [
        'DETI+ Control Center initialized.',
        'Confirmed: ' +
          result.registered,
        'Waitlist: ' +
          result.waitlisted,
        'CVs: ' +
          result.cvs,
      ].join(' ')
    );

    return result;
  } catch (err) {
    console.error(
      err &&
      err.stack
        ? err.stack
        : err
    );

    throw err;
  }
}

// -----------------------------------------------------------------------------
// Navigation helpers
// -----------------------------------------------------------------------------

function openDashboardFromMenu() {
  activateSheet_(
    DASHBOARD_SHEET_NAME
  );
}

function openRegistrationsFromMenu() {
  activateSheet_(
    SHEET_NAME
  );
}

function openStatisticsFromMenu() {
  activateSheet_(
    STATISTICS_SHEET_NAME
  );
}

function openSettingsFromMenu() {
  activateSheet_(
    SETTINGS_SHEET_NAME
  );
}

function activateSheet_(
  sheetName
) {
  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(
      sheetName
    );

  if (!sheet) {
    if (
      sheetName ===
      SHEET_NAME
    ) {
      sheet =
        getSheet_();
    } else if (
      sheetName ===
      SETTINGS_SHEET_NAME
    ) {
      sheet =
        getSettingsSheet_();
    } else {
      sheet =
        getOrCreateSheet_(
          sheetName
        );
    }
  }

  ss.setActiveSheet(
    sheet
  );
}
