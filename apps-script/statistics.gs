/**
 * DETI+ 2026 - dashboard and statistics
 */

const DASHBOARD_SHEET_NAME =
  'Dashboard';

const STATISTICS_SHEET_NAME =
  'Statistics';

// -----------------------------------------------------------------------------
// Refresh
// -----------------------------------------------------------------------------

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
      rows,
      config.timezone ||
      DEFAULT_EVENT_TIMEZONE
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

    checkedIn:
      statistics.checkedIn,

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
  rows,
  timezone
) {
  const now =
    new Date();

  const todayKey =
    Utilities.formatDate(
      now,
      timezone,
      'yyyy-MM-dd'
    );

  const stats = {
    totalRows:
      0,

    activeRows:
      0,

    confirmed:
      0,

    checkedIn:
      0,

    waitlisted:
      0,

    cancelled:
      0,

    withCv:
      0,

    withoutCv:
      0,

    cvSubmitted:
      0,

    cvUpdated:
      0,

    registrationsToday:
      0,

    registrationsLast24h:
      0,

    registrationsLast7Days:
      0,

    averagePerDay:
      0,

    peakDay:
      '',

    peakDayCount:
      0,

    byYear:
      {},

    byCourse:
      {},

    byDay:
      {},

    dailyRows:
      [],

    firstRegistrationAt:
      null,

    lastRegistrationAt:
      null,
  };

  rows.forEach(
    function (
      entry
    ) {
      const record =
        entry.record;

      if (
        !String(
          record.email ||
          ''
        ).trim() &&
        !String(
          record.token ||
          ''
        ).trim()
      ) {
        return;
      }

      stats.totalRows++;

      const status =
        normalizedRegistrationStatus_(
          record
        );

      const cvStatus =
        normalizedCvStatus_(
          record
        );

      if (
        status ===
        'cancelled'
      ) {
        stats.cancelled++;

        return;
      }

      stats.activeRows++;

      if (
        status ===
        'waitlisted'
      ) {
        stats.waitlisted++;
      } else {
        stats.confirmed++;

        if (
          status ===
          'checked_in'
        ) {
          stats.checkedIn++;
        }
      }

      if (
        cvStatus ===
          'submitted' ||
        cvStatus ===
          'updated' ||
        record.cvFileId
      ) {
        stats.withCv++;

        if (
          cvStatus ===
          'updated'
        ) {
          stats.cvUpdated++;
        } else {
          stats.cvSubmitted++;
        }
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
          record.course ||
          record.curse ||
          'Unknown'
        ).trim() ||
        'Unknown';

      incrementStat_(
        stats.byCourse,
        course
      );

      const registeredAt =
        registrationDate_(
          record
        );

      if (
        !registeredAt
      ) {
        return;
      }

      if (
        !stats.firstRegistrationAt ||
        registeredAt.getTime() <
          stats
            .firstRegistrationAt
            .getTime()
      ) {
        stats.firstRegistrationAt =
          registeredAt;
      }

      if (
        !stats.lastRegistrationAt ||
        registeredAt.getTime() >
          stats
            .lastRegistrationAt
            .getTime()
      ) {
        stats.lastRegistrationAt =
          registeredAt;
      }

      const day =
        Utilities.formatDate(
          registeredAt,
          timezone,
          'yyyy-MM-dd'
        );

      incrementStat_(
        stats.byDay,
        day
      );

      if (
        day ===
        todayKey
      ) {
        stats
          .registrationsToday++;
      }

      const ageMs =
        now.getTime() -
        registeredAt.getTime();

      if (
        ageMs >=
          0 &&
        ageMs <=
          24 *
          60 *
          60 *
          1000
      ) {
        stats
          .registrationsLast24h++;
      }

      if (
        ageMs >=
          0 &&
        ageMs <=
          7 *
          24 *
          60 *
          60 *
          1000
      ) {
        stats
          .registrationsLast7Days++;
      }
    }
  );

  stats.dailyRows =
    buildDailyRows_(
      stats.byDay
    );

  stats.dailyRows.forEach(
    function (
      row
    ) {
      if (
        row[1] >
        stats.peakDayCount
      ) {
        stats.peakDay =
          row[0];

        stats.peakDayCount =
          row[1];
      }
    }
  );

  if (
    stats.firstRegistrationAt
  ) {
    const days =
      Math.max(
        (
          now.getTime() -
          stats
            .firstRegistrationAt
            .getTime()
        ) /
        (
          24 *
          60 *
          60 *
          1000
        ),
        1
      );

    stats.averagePerDay =
      Math.round(
        (
          stats.activeRows /
          days
        ) *
        10
      ) / 10;
  }

  return stats;
}

function registrationDate_(
  record
) {
  const value =
    record.registeredAt ||
    record.timestamp;

  if (!value) {
    return null;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(
          value
        );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

function incrementStat_(
  map,
  key
) {
  map[
    key
  ] =
    Number(
      map[
        key
      ] ||
      0
    ) + 1;
}

function buildDailyRows_(
  map
) {
  const days =
    Object.keys(
      map
    ).sort();

  let cumulative =
    0;

  return days.map(
    function (
      day
    ) {
      const daily =
        map[
          day
        ];

      cumulative +=
        daily;

      return [
        day,
        daily,
        cumulative,
      ];
    }
  );
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

  const yearRows =
    statMapRows_(
      stats.byYear,
      false
    );

  const requiredRows =
    Math.max(
      20,
      courseRows.length +
        2,
      yearRows.length +
        2,
      stats.dailyRows.length +
        2
    );

  ensureSheetSize_(
    sheet,
    requiredRows,
    20
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
        'Checked in',
        stats.checkedIn,
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
    4,
    'CV status',
    [
      [
        'With CV',
        stats.withCv,
      ],
      [
        'Without CV',
        stats.withoutCv,
      ],
      [
        'Submitted',
        stats.cvSubmitted,
      ],
      [
        'Updated',
        stats.cvUpdated,
      ],
    ]
  );

  writeStatisticsSection_(
    sheet,
    7,
    'Time',
    [
      [
        'Today',
        stats.registrationsToday,
      ],
      [
        'Last 24h',
        stats.registrationsLast24h,
      ],
      [
        'Last 7 days',
        stats.registrationsLast7Days,
      ],
      [
        'Average/day',
        stats.averagePerDay,
      ],
      [
        'Peak day',
        stats.peakDay ||
        '—',
      ],
      [
        'Peak day registrations',
        stats.peakDayCount,
      ],
    ]
  );

  writeStatisticsSection_(
    sheet,
    10,
    'Academic year',
    yearRows
  );

  writeStatisticsSection_(
    sheet,
    13,
    'Course',
    courseRows
  );

  writeDailyStatistics_(
    sheet,
    16,
    stats.dailyRows
  );

  for (
    let column = 1;
    column <=
    20;
    column++
  ) {
    sheet.setColumnWidth(
      column,
      column % 3 ===
        2
        ? 110
        : 180
    );
  }
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
        'Value',
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
    );
}

function writeDailyStatistics_(
  sheet,
  startColumn,
  rows
) {
  sheet
    .getRange(
      1,
      startColumn,
      1,
      3
    )
    .setValues([
      [
        'Date',
        'Daily',
        'Cumulative',
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
      3
    )
    .setValues(
      rows
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
      function (
        key
      ) {
        return [
          key,
          map[
            key
          ],
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
    60,
    10
  );

  sheet.setHiddenGridlines(
    true
  );

  for (
    let column = 1;
    column <=
    10;
    column++
  ) {
    sheet.setColumnWidth(
      column,
      110
    );
  }

  sheet
    .getRange(
      'A1:J2'
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
      'A3:J3'
    )
    .merge()
    .setValue(
      'Operational overview · Last refreshed ' +
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
    'CHECKED IN',
    stats.checkedIn
  );

  renderDashboardCard_(
    sheet,
    'E5:F7',
    'WAITLIST',
    stats.waitlisted
  );

  renderDashboardCard_(
    sheet,
    'G5:H7',
    'CVs',
    stats.withCv
  );

  renderDashboardCard_(
    sheet,
    'I5:J7',
    'TODAY',
    stats.registrationsToday
  );

  renderDashboardCard_(
    sheet,
    'A9:B11',
    'CAPACITY',
    availability.capacity >
      0
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
    'OCCUPANCY',
    availability.percentage ===
      null
      ? '—'
      : (
          availability.percentage +
          '%'
        )
  );

  const cvRate =
    stats.activeRows >
      0
      ? Math.round(
          (
            stats.withCv /
            stats.activeRows
          ) *
          1000
        ) / 10
      : 0;

  renderDashboardCard_(
    sheet,
    'G9:H11',
    'CV RATE',
    cvRate +
    '%'
  );

  renderDashboardCard_(
    sheet,
    'I9:J11',
    'LAST 24H',
    stats.registrationsLast24h
  );

  sheet
    .getRange(
      'A13:J13'
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
    );

  const eventInfo = [
    [
      'Registration enabled',
      config.registrationEnabled
        ? 'Yes'
        : 'No',

      'Current state',
      String(
        availability.state
      ).toUpperCase(),
    ],

    [
      'Registration opens',
      formatDashboardDate_(
        config.registrationOpensAt,
        config.timezone
      ),

      'Registration closes',
      formatDashboardDate_(
        config.registrationClosesAt,
        config.timezone
      ),
    ],

    [
      'Maximum registrations',
      config.maxRegistrations ===
        0
        ? 'Unlimited'
        : config.maxRegistrations,

      'Waitlist',
      config.waitlistEnabled
        ? 'Enabled'
        : 'Disabled',
    ],

    [
      'Maximum waitlist',
      config.maxWaitlist ===
        0
        ? 'Unlimited'
        : config.maxWaitlist,

      'CV deadline',
      formatDashboardDate_(
        config.cvDeadline,
        config.timezone
      ),
    ],

    [
      'Data retention until',
      formatDashboardDate_(
        config.dataRetentionUntil,
        config.timezone
      ),

      'Schema version',
      typeof getSchemaVersion_ ===
        'function'
        ? (
            getSchemaVersion_() +
            '/' +
            CURRENT_SCHEMA_VERSION
          )
        : '—',
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
    );

  sheet
    .getRange(
      'A14:A18'
    )
    .setFontWeight(
      'bold'
    )
    .setFontColor(
      '#6b7280'
    );

  sheet
    .getRange(
      'C14:C18'
    )
    .setFontWeight(
      'bold'
    )
    .setFontColor(
      '#6b7280'
    );

  renderOperationalWarnings_(
    sheet,
    stats,
    availability
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
      String(
        value
      )
    )
    .setFontWeight(
      'bold'
    )
    .setFontSize(
      14
    )
    .setWrap(
      true
    )
    .setVerticalAlignment(
      'middle'
    );
}

function renderOperationalWarnings_(
  sheet,
  stats,
  availability
) {
  let message =
    '● Operational';

  if (
    availability.state ===
    'full'
  ) {
    message =
      '● FULL — event capacity reached';
  } else if (
    availability.percentage !==
      null &&
    availability.percentage >=
      90
  ) {
    message =
      '⚠ Capacity above 90%';
  } else if (
    stats.withoutCv >
    0
  ) {
    message =
      '● Operational · ' +
      stats.withoutCv +
      ' participant(s) without CV';
  }

  sheet
    .getRange(
      'A20:J20'
    )
    .merge()
    .setValue(
      message
    )
    .setBackground(
      '#f9fafb'
    )
    .setFontWeight(
      'bold'
    );
}

// -----------------------------------------------------------------------------
// Charts
// -----------------------------------------------------------------------------

function addDashboardCharts_(
  dashboard,
  statisticsSheet,
  stats
) {
  dashboard
    .getCharts()
    .forEach(
      function (
        chart
      ) {
        dashboard.removeChart(
          chart
        );
      }
    );

  if (
    !stats.dailyRows.length
  ) {
    return;
  }

  const lastRow =
    stats.dailyRows.length +
    1;

  const dailyChart =
    dashboard
      .newChart()
      .setChartType(
        Charts.ChartType
          .COLUMN
      )
      .addRange(
        statisticsSheet
          .getRange(
            1,
            16,
            lastRow,
            2
          )
      )
      .setPosition(
        22,
        1,
        0,
        0
      )
      .setOption(
        'title',
        'Daily registrations'
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
    dailyChart
  );

  const cumulativeChart =
    dashboard
      .newChart()
      .setChartType(
        Charts.ChartType
          .LINE
      )
      .addRange(
        statisticsSheet
          .getRange(
            1,
            16,
            lastRow,
            1
          )
      )
      .addRange(
        statisticsSheet
          .getRange(
            1,
            18,
            lastRow,
            1
          )
      )
      .setPosition(
        22,
        6,
        0,
        0
      )
      .setOption(
        'title',
        'Cumulative registrations'
      )
      .build();

  dashboard.insertChart(
    cumulativeChart
  );
}

// -----------------------------------------------------------------------------
// Utility
// -----------------------------------------------------------------------------

function formatDashboardDate_(
  value,
  timezone
) {
  if (!value) {
    return '—';
  }

  try {
    return Utilities.formatDate(
      value instanceof Date
        ? value
        : new Date(
            value
          ),
      timezone ||
      DEFAULT_EVENT_TIMEZONE,
      'dd/MM/yyyy HH:mm'
    );
  } catch (err) {
    return '—';
  }
}

/**
 * Resets a derived sheet safely.
 *
 * Important:
 *
 * getDataRange().breakApart() is not reliable when a merged range extends
 * beyond the current data range. Google Sheets then considers only part of
 * the merged range selected and throws:
 *
 * "You must select all cells in a merged range..."
 *
 * We therefore inspect the entire physical sheet and break every merged range
 * individually before clearing content/formatting.
 */
function resetDerivedSheet_(
  sheet
) {
  /*
   * Remove all charts first.
   */
  sheet
    .getCharts()
    .forEach(
      function (
        chart
      ) {
        sheet.removeChart(
          chart
        );
      }
    );

  const maxRows =
    sheet.getMaxRows();

  const maxColumns =
    sheet.getMaxColumns();

  if (
    maxRows >
      0 &&
    maxColumns >
      0
  ) {
    const wholeSheet =
      sheet.getRange(
        1,
        1,
        maxRows,
        maxColumns
      );

    const mergedRanges =
      wholeSheet
        .getMergedRanges();

    mergedRanges.forEach(
      function (
        mergedRange
      ) {
        mergedRange.breakApart();
      }
    );
  }

  /*
   * Ensure the structural merge changes are committed before clearing and
   * rebuilding the layout.
   */
  SpreadsheetApp.flush();

  /*
   * Clearing the entire physical sheet makes the function deterministic:
   * there cannot be stale formatting outside the previous data range.
   */
  if (
    maxRows >
      0 &&
    maxColumns >
      0
  ) {
    sheet
      .getRange(
        1,
        1,
        maxRows,
        maxColumns
      )
      .clear();
  }

  SpreadsheetApp.flush();
}

function moveControlSheetsToFront_(
  ss,
  dashboard,
  registration,
  statistics
) {
  ss.setActiveSheet(
    dashboard
  );

  ss.moveActiveSheet(
    1
  );

  ss.setActiveSheet(
    registration
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

  ss.setActiveSheet(
    dashboard
  );
}
