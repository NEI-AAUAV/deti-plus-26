/**
 * DETI+ 2026 - Google Sheets administration
 *
 * Phase 4 contains read-only / non-destructive operational tools.
 */

// -----------------------------------------------------------------------------
// Spreadsheet menu
// -----------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp
    .getUi()
    .createMenu(
      'DETI+'
    )
    .addItem(
      'Refresh Control Center',
      'refreshControlCenterFromMenu'
    )
    .addSeparator()
    .addItem(
      'Open Dashboard',
      'openDashboardFromMenu'
    )
    .addItem(
      'Open Registrations',
      'openRegistrationsFromMenu'
    )
    .addItem(
      'Open Statistics',
      'openStatisticsFromMenu'
    )
    .addItem(
      'Open Settings',
      'openSettingsFromMenu'
    )
    .addSeparator()
    .addItem(
      'Initialize / Repair Control Center',
      'initializeControlCenterFromMenu'
    )
    .addToUi();
}

// -----------------------------------------------------------------------------
// Menu actions
// -----------------------------------------------------------------------------

function refreshControlCenterFromMenu() {
  const ss =
    getSpreadsheet_();

  try {
    const result =
      refreshControlCenter_();

    ss.toast(
      [
        'Confirmed: ' +
          result.registered,

        'Waitlist: ' +
          result.waitlisted,

        'CVs: ' +
          result.cvs,
      ].join(
        ' · '
      ),
      'DETI+ dashboard refreshed',
      5
    );
  } catch (err) {
    console.error(
      err &&
      err.stack
        ? err.stack
        : err
    );

    ss.toast(
      'The control center could not be refreshed. Check Apps Script logs.',
      'DETI+ error',
      8
    );

    throw err;
  }
}

function initializeControlCenterFromMenu() {
  const ss =
    getSpreadsheet_();

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

    refreshControlCenter_();

    ss.toast(
      'Dashboard, Statistics, Settings and Registration are ready.',
      'DETI+ initialized',
      6
    );
  } catch (err) {
    console.error(
      err &&
      err.stack
        ? err.stack
        : err
    );

    ss.toast(
      'Initialization failed. Check Apps Script logs.',
      'DETI+ error',
      8
    );

    throw err;
  }
}

// -----------------------------------------------------------------------------
// Navigation
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
