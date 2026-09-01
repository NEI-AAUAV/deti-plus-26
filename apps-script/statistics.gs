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
    registrationSheet
  );

  // Statistics remains a hidden data source for native charts. Everything an
  // operator needs to read is rendered on Dashboard, avoiding two competing
  // reporting surfaces while retaining a non-destructive chart source.
  statisticsSheet.hideSheet();

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

        if (isRecordCheckedIn_(record)) {
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
    90,
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

  sheet.getRange('A1:C2').merge();
  styleDetiLogoCell_(sheet.getRange('A1:C2'));

  sheet
    .getRange('A3:C3')
    .merge()
    .setValue('PAINEL OPERACIONAL')
    .setBackground(DETI_SHEET_THEME.panel)
    .setFontColor(DETI_SHEET_THEME.accent)
    .setFontWeight('bold')
    .setFontSize(10)
    .setVerticalAlignment('middle');

  sheet
    .getRange(
      'D3:J3'
    )
    .merge()
    .setValue(
      'Atualizado em ' +
      Utilities.formatDate(
        new Date(),
        config.timezone ||
        DEFAULT_EVENT_TIMEZONE,
        'dd/MM/yyyy HH:mm'
      )
    )
    .setFontColor(DETI_SHEET_THEME.muted)
    .setFontSize(
      10
    );

  renderDashboardCard_(
    sheet,
    'A5:B7',
    'CONFIRMADOS',
    stats.confirmed
  );

  renderDashboardCard_(
    sheet,
    'C5:D7',
    'CHECK-IN',
    stats.checkedIn
  );

  renderDashboardCard_(
    sheet,
    'E5:F7',
    'LISTA DE ESPERA',
    stats.waitlisted
  );

  renderDashboardCard_(
    sheet,
    'G5:H7',
    'CVS RECEBIDOS',
    stats.withCv
  );

  renderDashboardCard_(
    sheet,
    'I5:J7',
    'HOJE',
    stats.registrationsToday
  );

  renderDashboardCard_(
    sheet,
    'A9:B11',
    'LOTAÇÃO',
    availability.capacity >
      0
      ? availability.capacity
      : 'Sem limite'
  );

  renderDashboardCard_(
    sheet,
    'C9:D11',
    'VAGAS',
    availability.remaining ===
      null
      ? '—'
      : availability.remaining
  );

  renderDashboardCard_(
    sheet,
    'E9:F11',
    'OCUPAÇÃO',
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
    'TAXA DE CV',
    cvRate +
    '%'
  );

  renderDashboardCard_(
    sheet,
    'I9:J11',
    'ÚLTIMAS 24H',
    stats.registrationsLast24h
  );

  sheet
    .getRange(
      'A13:J13'
    )
    .merge()
    .setValue(
      'Configuração do evento'
    )
    .setBackground(
      '#f3f4f6'
    )
    .setFontWeight(
      'bold'
    );

  const eventInfo = [
    [
      'Inscrições ativas',
      config.registrationEnabled
        ? 'Sim'
        : 'Não',

      'Estado atual',
      String(
        availability.state
      ).toUpperCase(),
    ],

    [
      'Abertura das inscrições',
      formatDashboardDate_(
        config.registrationOpensAt,
        config.timezone
      ),

      'Fecho das inscrições',
      formatDashboardDate_(
        config.registrationClosesAt,
        config.timezone
      ),
    ],

    [
      'Máximo de inscrições',
      config.maxRegistrations ===
        0
        ? 'Sem limite'
        : config.maxRegistrations,

      'Lista de espera',
      config.waitlistEnabled
        ? 'Ativa'
        : 'Inativa',
    ],

    [
      'Máximo em lista de espera',
      config.maxWaitlist ===
        0
        ? 'Sem limite'
        : config.maxWaitlist,

      'Prazo de CV',
      formatDashboardDate_(
        config.cvDeadline,
        config.timezone
      ),
    ],

    [
      'Retenção de dados até',
      formatDashboardDate_(
        config.dataRetentionUntil,
        config.timezone
      ),

      'Versão do esquema',
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

  renderDashboardStatistics_(sheet, stats);

  addDashboardCharts_(
    sheet,
    statisticsSheet,
    stats,
    50
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
    .setBackground(DETI_SHEET_THEME.body)
    .setBorder(
      true,
      true,
      true,
      true,
      false,
      false,
      DETI_SHEET_THEME.border,
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
    .setFontFamily(DETI_SHEET_THEME.font)
    .setFontColor(DETI_SHEET_THEME.panel)
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
    '● Operacional';

  if (
    availability.state ===
    'full'
  ) {
    message =
      '● LOTADO — capacidade do evento atingida';
  } else if (
    availability.percentage !==
      null &&
    availability.percentage >=
      90
  ) {
    message =
      '⚠ Ocupação acima de 90%';
  } else if (
    stats.withoutCv >
    0
  ) {
    message =
      '● Operacional · ' +
      stats.withoutCv +
      ' participante(s) sem CV';
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
      DETI_SHEET_THEME.accentSoft
    )
    .setFontWeight(
      'bold'
    );
}

/** Renders the previously separate Statistics sheet as dashboard panels. */
function renderDashboardStatistics_(sheet, stats) {
  const registrationRows = [
    ['Confirmados', stats.confirmed],
    ['Check-in', stats.checkedIn],
    ['Lista de espera', stats.waitlisted],
    ['Cancelados', stats.cancelled],
  ];

  const cvRows = [
    ['Com CV', stats.withCv],
    ['Sem CV', stats.withoutCv],
    ['Enviados', stats.cvSubmitted],
    ['Atualizados', stats.cvUpdated],
  ];

  const timeRows = [
    ['Hoje', stats.registrationsToday],
    ['Últimas 24h', stats.registrationsLast24h],
    ['Últimos 7 dias', stats.registrationsLast7Days],
    ['Média/dia', stats.averagePerDay],
    ['Dia de maior adesão', stats.peakDay || '—'],
    ['Inscrições nesse dia', stats.peakDayCount],
  ];

  renderDashboardTablePanel_(sheet, 'A22:D22', 'Inscrições', registrationRows, 23);
  renderDashboardTablePanel_(sheet, 'E22:H22', 'CVs', cvRows, 23);
  renderDashboardTablePanel_(sheet, 'I22:J22', 'Ritmo', timeRows, 23);

  renderDashboardTablePanel_(
    sheet,
    'A31:D31',
    'Por curso',
    statMapRows_(stats.byCourse, true).slice(0, 12),
    32
  );

  renderDashboardTablePanel_(
    sheet,
    'E31:H31',
    'Por ano curricular',
    statMapRows_(stats.byYear, false),
    32
  );

  const dailyRows = stats.dailyRows.slice(-14).map(function (row) {
    return [row[0], row[1] + ' inscrição(ões)', row[2] + ' acumuladas'];
  });
  renderDashboardTablePanel_(sheet, 'I31:J31', 'Últimos dias', dailyRows, 32);
}

function renderDashboardTablePanel_(sheet, titleRange, title, rows, startRow) {
  const titleCell = sheet.getRange(titleRange);
  const startColumn = titleCell.getColumn();
  const width = titleCell.getNumColumns();

  titleCell
    .merge()
    .setValue(title)
    .setBackground(DETI_SHEET_THEME.panel)
    .setFontColor(DETI_SHEET_THEME.white)
    .setFontFamily(DETI_SHEET_THEME.font)
    .setFontWeight('bold')
    .setVerticalAlignment('middle');

  if (!rows.length) {
    sheet.getRange(startRow, startColumn, 1, width).merge()
      .setValue('Ainda sem dados.')
      .setFontColor(DETI_SHEET_THEME.muted);
    return;
  }

  const content = rows.map(function (row) {
    return [row[0], row.slice(1).join(' · ')];
  });
  const range = sheet.getRange(startRow, startColumn, content.length, width);
  const expanded = content.map(function (row) {
    const values = [row[0], row[1]];
    while (values.length < width) values.push('');
    return values;
  });

  range.setValues(expanded)
    .setFontFamily(DETI_SHEET_THEME.font)
    .setFontSize(10)
    .setVerticalAlignment('middle')
    .setBackground(DETI_SHEET_THEME.bodyAlt);

  sheet.getRange(startRow, startColumn, content.length, 1)
    .setFontWeight('bold')
    .setFontColor(DETI_SHEET_THEME.panel);
  sheet.getRange(startRow, startColumn + 1, content.length, width - 1)
    .setFontColor('#525252');
}

// -----------------------------------------------------------------------------
// Charts
// -----------------------------------------------------------------------------

function addDashboardCharts_(
  dashboard,
  statisticsSheet,
  stats,
  firstRow
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
        firstRow || 22,
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
        firstRow || 22,
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
  registration
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
    dashboard
  );
}
