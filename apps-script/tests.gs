/** Pure, manual Apps Script self-tests. No Drive, Gmail or sheet mutations. */
function runBackendSelfTests() {
  const results = [];

  const check = function (name, actual, expected) {
    const passed = actual === expected;
    results.push({
      name: name,
      passed: passed,
      actual: actual,
      expected: expected,
    });
    return passed;
  };

  check(
    'legacy checked_in status',
    normalizedRegistrationStatus_({ state: 'checked_in' }),
    'confirmed'
  );
  check(
    'canonical checked_in status',
    normalizedRegistrationStatus_({ registrationStatus: 'checked_in' }),
    'confirmed'
  );
  check(
    'waitlisted status',
    normalizedRegistrationStatus_({ registrationStatus: 'waitlisted' }),
    'waitlisted'
  );
  check(
    'cancelled status',
    normalizedRegistrationStatus_({ registrationStatus: 'cancelled' }),
    'cancelled'
  );
  check(
    'confirmed status',
    normalizedRegistrationStatus_({ registrationStatus: 'confirmed' }),
    'confirmed'
  );
  check('legacy confirmed state', legacyStateFor_('confirmed', 'none'), 'registered');
  check('legacy CV state', legacyStateFor_('confirmed', 'submitted'), 'cv_delivered');
  check('legacy waitlist state', legacyStateFor_('waitlisted', 'none'), 'waitlisted');
  check('legacy cancel state', legacyStateFor_('cancelled', 'none'), 'cancelled');
  check('migration inference', inferMigrationRegistrationStatus_('checked_in'), 'confirmed');
  check('checked-in inference', isRecordCheckedIn_({ checkedIn: 'true' }), true);
  check('email first name', firstName_('Ana Maria Silva'), 'Ana');
  check(
    'admin search accepts Portuguese CV shorthand',
    adminCvSearchTerms_('none').indexOf('sem cv') !== -1,
    true
  );
  check(
    'admin search tokenizes mixed terms',
    adminSearchTerms_('Martim, sem CV').join('|'),
    'martim|sem|cv'
  );
  check(
    'admin quick filter matches waitlist',
    adminMatchesQuickFilters_(
      { registrationStatus: 'waitlisted', cvStatus: 'none', checkedIn: false },
      { registration: 'Lista de espera', cv: 'Sem CV', checkin: 'Sem check-in' }
    ),
    true
  );

  const textPreview = renderParticipantTextEmail_(
    { name: 'Ana Silva' },
    {
      eyebrow: 'REGISTRATION',
      title: "you're in.",
      intro: 'Your place is confirmed.',
      status: 'CONFIRMED',
      facts: [{ label: 'WHEN', value: '19 — 21 MAY' }],
      primaryAction: { label: 'OPEN', url: 'https://example.com/personal' },
      personalLink: true,
    }
  );

  check('email text contains greeting', textPreview.indexOf('Hi Ana,') !== -1, true);
  check('email text contains status', textPreview.indexOf('STATUS: CONFIRMED') !== -1, true);
  check(
    'email text contains personal warning',
    textPreview.indexOf('Do not share it') !== -1,
    true
  );

  const failed = results.filter(function (result) { return !result.passed; });
  const output = {
    passed: results.length - failed.length,
    failed: failed.length,
    results: results,
  };

  if (failed.length) {
    throw new Error(
      'Backend self-tests failed: ' +
        failed.map(function (result) { return result.name; }).join(', ')
    );
  }

  return output;
}
