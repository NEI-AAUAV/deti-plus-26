/**
 * DETI+ 2026 - dashboard and statistics
 */

const DASHBOARD_SHEET_NAME =
  'Dashboard';

const STATISTICS_SHEET_NAME =
  'Statistics';

/**
 * Rebuilds the operational Dashboard and Statistics sheets.
 *
 * Both sheets are derived views.
 *
 * Registration remains the source of truth and is never cleared,
 * reordered or migrated by this function.
 */
function refreshControlCenter_() {
  const ss =
    getSpreadsheet_();

  const registrationSheet =
    getSheet_();

  const rows =
    readRecords_(
      registrationSheet
    );

  const config =
    getEventConfig_();

  const availability =
    getRegistrationState_();

  const statistics =
    buildRegistrationStatistics_(
      rows
    );

  formatRegistrationSheet_(
    registrationSheet
  );

  formatSettingsSheet_(
    getSettingsSheet_()
  );

  const statisticsSheet =
    getOrCreateSheet_(
      STATISTICS_SHEET_NAME
    );

  renderStatisticsSheet_(
    statisticsSheet,
    statistics
  );

  const dashboardSheet =
    getOrCreateSheet_(
      DASHBOARD_SHEET_NAME
    );

  renderDashboardSheet_(
    dashboardSheet,
    statisticsSheet,
    statistics,
    availability,
    config
  );

  moveControlSheetsToFront_(
    ss,
    dashboardSheet,
    registrationSheet,
    statisticsSheet
  );

  return {
    registered:
      statistics.confirmed,

    waitlisted:
      statistics.waitlisted,

    cancelled:
      statistics.cancelled,

    cvs:
      statistics.withCv,
  };
}

// -----------------------------------------------------------------------------
// Statistics calculation
// -----------------------------------------------------------------------------

function buildRegistrationStatistics_(
  rows
) {
  const stats = {
    totalRows:
      0,

    activeRows:
      0,

    confirmed:
      0,

    waitlisted:
      0,

    cancelled:
      0,

    withCv:
      0,

    withoutCv:
      0,

    byYear:
      {},

    byCourse:
      {},

    byDay:
      {},
  };

  rows.forEach(
    function (entry) {
      const record =
        entry.record;

      if (
        !String(
          record.email || ''
        ).trim() &&
        !String(
          record.token || ''
        ).trim()
      ) {
        return;
      }

      stats.totalRows++;

      const state =
        String(
          record.state || ''
        )
          .trim()
          .toLowerCase();

      if (
        state ===
        'cancelled'
      ) {
        stats.cancelled++;
      } else {
        stats.activeRows++;

        if (
          state ===
          'waitlisted'
        ) {
          stats.waitlisted++;
        } else {
          /*
           * Backwards compatibility:
           *
           * registered
           * cv_delivered
           * blank legacy state
           *
           * are all confirmed.
           */
          stats.confirmed++;
        }
      }

      if (
        record.cvFileId
      ) {
        stats.withCv++;
      } else {
        stats.withoutCv++;
      }

      const year =
        String(
          record.year ||
          'Unknown'
        ).trim() ||
        'Unknown';

      incrementStat_(
        stats.byYear,
        year
      );

      const course =
        String(
          record.curse ||
          'Unknown'
        ).trim() ||
        'Unknown';

      incrementStat_(
        stats.byCourse,
        course
      );

      if (
        record.timestamp
      ) {
        const date =
          record.timestamp
            instanceof Date
            ? record.timestamp
            : new Date(
                record.timestamp
              );

        if (
          !Number.isNaN(
            date.getTime()
          )
        ) {
          const day =
            Utilities.formatDate(
              date,
              DEFAULT_EVENT_TIMEZONE,
              'yyyy-MM-dd'
            );

          incrementStat_(
            stats.byDay,
            day
          );
        }
      }
    }
  );

  return stats;
}

function incrementStat_(
  map,
  key
) {
  map[key] =
    Number(
      map[key] || 0
    ) + 1;
}

// -----------------------------------------------------------------------------
// Statistics sheet
// -----------------------------------------------------------------------------

function renderStatisticsSheet_(
  sheet,
  stats
) {
  resetDerivedSheet_(
    sheet
  );

  const courseRows =
    statMapRows_(
      stats.byCourse,
      true
    );

  const dayRows =
    statMapRows_(
      stats.byDay,
      false
    );

  const yearRows =
    statMapRows_(
      stats.byYear,
      false
    );

  const requiredRows =
    Math.max(
      10,
      courseRows.length + 2,
      dayRows.length + 2,
      yearRows.length + 2
    );

  ensureSheetSize_(
    sheet,
    requiredRows,
    15
  );

  sheet.setHiddenGridlines(
    true
  );

  sheet.setFrozenRows(
    1
  );

  writeStatisticsSection_(
    sheet,
    1,
    'Registration status',
    [
      [
        'Confirmed',
        stats.confirmed,
      ],
      [
        'Waitlisted',
        stats.waitlisted,
      ],
      [
        'Cancelled',
        stats.cancelled,
      ],
    ]
  );

  writeStatisticsSection_(
    sheet,
    5,
    'Academic year',
    yearRows
  );

  writeStatisticsSection_(
    sheet,
    8,
    'CV status',
    [
      [
        'CV submitted',
        stats.withCv,
      ],
      [
        'No CV',
        stats.withoutCv,
      ],
    ]
  );

  writeStatisticsSection_(
    sheet,
    11,
    'Course',
    courseRows
  );

  writeStatisticsSection_(
    sheet,
    14,
    'Registrations by day',
    dayRows
  );

  [
    1,
    5,
    8,
    11,
    14,
  ].forEach(
    function (column) {
      sheet.setColumnWidth(
        column,
        220
      );

      sheet.setColumnWidth(
        column + 1,
        110
      );
    }
  );
}

function writeStatisticsSection_(
  sheet,
  startColumn,
  title,
  rows
) {
  sheet
    .getRange(
      1,
      startColumn,
      1,
      2
    )
    .setValues([
      [
        title,
        'Count',
      ],
    ])
    .setBackground(
      '#111827'
    )
    .setFontColor(
      '#ffffff'
    )
    .setFontWeight(
      'bold'
    )
    .setVerticalAlignment(
      'middle'
    );

  if (
    !rows.length
  ) {
    return;
  }

  sheet
    .getRange(
      2,
      startColumn,
      rows.length,
      2
    )
    .setValues(
      rows
    )
    .setVerticalAlignment(
      'middle'
    );

  sheet
    .getRange(
      2,
      startColumn + 1,
      rows.length,
      1
    )
    .setNumberFormat(
      '0'
    )
    .setHorizontalAlignment(
      'right'
    );
}

function statMapRows_(
  map,
  descendingByCount
) {
  const rows =
    Object.keys(
      map
    ).map(
      function (key) {
        return [
          key,
          map[key],
        ];
      }
    );

  rows.sort(
    function (
      a,
      b
    ) {
      if (
        descendingByCount
      ) {
        return (
          b[1] -
            a[1] ||
          String(
            a[0]
          ).localeCompare(
            String(
              b[0]
            )
          )
        );
      }

      return String(
        a[0]
      ).localeCompare(
        String(
          b[0]
        )
      );
    }
  );

  return rows;
}

// -----------------------------------------------------------------------------
// Dashboard
// -----------------------------------------------------------------------------

function renderDashboardSheet_(
  sheet,
  statisticsSheet,
  stats,
  availability,
  config
) {
  resetDerivedSheet_(
    sheet
  );

  ensureSheetSize_(
    sheet,
    55,
    8
  );

  sheet.setHiddenGridlines(
    true
  );

  for (
    let column = 1;
    column <= 8;
    column++
  ) {
    sheet.setColumnWidth(
      column,
      125
    );
  }

  sheet
    .getRange(
      'A1:H2'
    )
    .merge()
    .setValue(
      config.eventName +
      ' — Registration Control Center'
    )
    .setBackground(
      '#111827'
    )
    .setFontColor(
      '#ffffff'
    )
    .setFontWeight(
      'bold'
    )
    .setFontSize(
      20
    )
    .setVerticalAlignment(
      'middle'
    );

  sheet
    .getRange(
      'A3:H3'
    )
    .merge()
    .setValue(
      'Live operational overview · Last refreshed ' +
      Utilities.formatDate(
        new Date(),
        config.timezone ||
          DEFAULT_EVENT_TIMEZONE,
        'dd/MM/yyyy HH:mm'
      )
    )
    .setFontColor(
      '#6b7280'
    )
    .setFontSize(
      10
    );

  renderDashboardCard_(
    sheet,
    'A5:B7',
    'CONFIRMED',
    stats.confirmed
  );

  renderDashboardCard_(
    sheet,
    'C5:D7',
    'WAITLIST',
    stats.waitlisted
  );

  renderDashboardCard_(
    sheet,
    'E5:F7',
    'CVs RECEIVED',
    stats.withCv
  );

  renderDashboardCard_(
    sheet,
    'G5:H7',
    'TOTAL RECORDS',
    stats.totalRows
  );

  renderDashboardCard_(
    sheet,
    'A9:B11',
    'CAPACITY',
    availability.capacity > 0
      ? availability.capacity
      : 'Unlimited'
  );

  renderDashboardCard_(
    sheet,
    'C9:D11',
    'PLACES LEFT',
    availability.remaining ===
      null
      ? '—'
      : availability.remaining
  );

  renderDashboardCard_(
    sheet,
    'E9:F11',
    'STATE',
    String(
      availability.state ||
      ''
    ).toUpperCase()
  );

  const cvRate =
    stats.totalRows > 0
      ? Math.round(
          (
            stats.withCv /
            stats.totalRows
          ) * 1000
        ) / 10
      : 0;

  renderDashboardCard_(
    sheet,
    'G9:H11',
    'CV RATE',
    cvRate + '%'
  );

  sheet
    .getRange(
      'A13:H13'
    )
    .merge()
    .setValue(
      'Event configuration'
    )
    .setBackground(
      '#f3f4f6'
    )
    .setFontWeight(
      'bold'
    )
    .setFontColor(
      '#111827'
    );

  const eventInfo = [
    [
      'Registration enabled',
      config.registrationEnabled
        ? 'Yes'
        : 'No',

      'Waitlist enabled',
      config.waitlistEnabled
        ? 'Yes'
        : 'No',
    ],

    [
      'Opens',
      formatDashboardDate_(
        config.registrationOpensAt,
        config.timezone
      ),

      'Closes',
      formatDashboardDate_(
        config.registrationClosesAt,
        config.timezone
      ),
    ],

    [
      'Max registrations',
      config.maxRegistrations ===
        0
        ? 'Unlimited'
        : config.maxRegistrations,

      'Max waitlist',
      config.maxWaitlist ===
        0
        ? 'Unlimited'
        : config.maxWaitlist,
    ],

    [
      'CV uploads enabled',
      config.cvUploadsEnabled
        ? 'Yes'
        : 'No',

      'CV deadline',
      formatDashboardDate_(
        config.cvDeadline,
        config.timezone
      ),
    ],
  ];

  sheet
    .getRange(
      14,
      1,
      eventInfo.length,
      4
    )
    .setValues(
      eventInfo
    )
    .setWrap(
      true
    )
    .setVerticalAlignment(
      'middle'
    );

  sheet
    .getRange(
      'A14:A17'
    )
    .setFontWeight(
      'bold'
    )
    .setFontColor(
      '#6b7280'
    );

  sheet
    .getRange(
      'C14:C17'
    )
    .setFontWeight(
      'bold'
    )
    .setFontColor(
      '#6b7280'
    );

  addDashboardCharts_(
    sheet,
    statisticsSheet,
    stats
  );

  sheet.setFrozenRows(
    3
  );
}

function renderDashboardCard_(
  sheet,
  a1,
  label,
  value
) {
  const range =
    sheet.getRange(
      a1
    );

  range
    .merge()
    .setBackground(
      '#ffffff'
    )
    .setBorder(
      true,
      true,
      true,
      true,
      false,
      false,
      '#d1d5db',
      SpreadsheetApp
        .BorderStyle
        .SOLID
    );

  const cell =
    range.getCell(
      1,
      1
    );

  cell
    .setValue(
      label +
      '\n' +
      value
    )
    .setWrap(
      true
    )
    .setVerticalAlignment(
      'middle'
    )
    .setHorizontalAlignment(
      'left'
    )
    .setFontColor(
      '#111827'
    )
    .setFontWeight(
      'bold'
    )
    .setFontSize(
      14
    );
}

// -----------------------------------------------------------------------------
// Dashboard charts
// -----------------------------------------------------------------------------

function addDashboardCharts_(
  dashboard,
  statisticsSheet,
  stats
) {
  dashboard
    .getCharts()
    .forEach(
      function (chart) {
        dashboard.removeChart(
          chart
        );
      }
    );

  const statusChart =
    dashboard
      .newChart()
      .asPieChart()
      .addRange(
        statisticsSheet
          .getRange(
            'A1:B4'
          )
      )
      .setPosition(
        19,
        1,
        0,
        0
      )
      .setOption(
        'title',
        'Registration status'
      )
      .setOption(
        'legend',
        {
          position:
            'right',
        }
      )
      .build();

  dashboard.insertChart(
    statusChart
  );

  const cvChart =
    dashboard
      .newChart()
      .asPieChart()
      .addRange(
        statisticsSheet
          .getRange(
            'H1:I3'
          )
      )
      .setPosition(
        19,
        5,
        0,
        0
      )
      .setOption(
        'title',
        'CV coverage'
      )
      .setOption(
        'legend',
        {
          position:
            'right',
        }
      )
      .build();

  dashboard.insertChart(
    cvChart
  );

  const yearRows =
    Object.keys(
      stats.byYear
    ).length + 1;

  if (
    yearRows > 1
  ) {
    const yearChart =
      dashboard
        .newChart()
        .asColumnChart()
        .addRange(
          statisticsSheet
            .getRange(
              1,
              5,
              yearRows,
              2
            )
        )
        .setPosition(
          36,
          1,
          0,
          0
        )
        .setOption(
          'title',
          'Registrations by academic year'
        )
        .setOption(
          'legend',
          {
            position:
              'none',
          }
        )
        .build();

    dashboard.insertChart(
      yearChart
    );
  }

  const dayRows =
    Object.keys(
      stats.byDay
    ).length + 1;

  if (
    dayRows > 1
  ) {
    const dayChart =
      dashboard
        .newChart()
        .asLineChart()
        .addRange(
          statisticsSheet
            .getRange(
              1,
              14,
              dayRows,
              2
            )
        )
        .setPosition(
          36,
          5,
          0,
          0
        )
        .setOption(
          'title',
          'Registrations over time'
        )
        .setOption(
          'legend',
          {
            position:
              'none',
          }
        )
        .build();

    dashboard.insertChart(
      dayChart
    );
  }
}

// -----------------------------------------------------------------------------
// Dashboard helpers
// -----------------------------------------------------------------------------

function formatDashboardDate_(
  value,
  timezone
) {
  if (!value) {
    return 'No restriction';
  }

  return Utilities.formatDate(
    value,
    timezone ||
      DEFAULT_EVENT_TIMEZONE,
    'dd/MM/yyyy HH:mm'
  );
}

function resetDerivedSheet_(
  sheet
) {
  sheet
    .getRange(
      1,
      1,
      sheet.getMaxRows(),
      sheet.getMaxColumns()
    )
    .breakApart();

  sheet.clear();

  sheet
    .getCharts()
    .forEach(
      function (chart) {
        sheet.removeChart(
          chart
        );
      }
    );
}

function moveControlSheetsToFront_(
  ss,
  dashboard,
  registrations,
  statistics
) {
  ss.setActiveSheet(
    dashboard
  );

  ss.moveActiveSheet(
    1
  );

  ss.setActiveSheet(
    registrations
  );

  ss.moveActiveSheet(
    2
  );

  ss.setActiveSheet(
    statistics
  );

  ss.moveActiveSheet(
    3
  );

  const settings =
    ss.getSheetByName(
      SETTINGS_SHEET_NAME
    );

  if (settings) {
    ss.setActiveSheet(
      settings
    );

    ss.moveActiveSheet(
      4
    );
  }

  ss.setActiveSheet(
    dashboard
  );
}
