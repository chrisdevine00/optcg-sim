# Testing: time and statistics

The rule for every test that touches a clock or a sample of games. It exists because per-push CI
and the nightly each failed for reasons that were not defects (DECISIONS 2026-11-27, "Tests:
deterministic per push, timing measured nightly, rate checks by confidence interval"): a worker
wait of 3 s on a shared runner, a rate of 0.74 against a line of 0.80 over 19 samples, a timeout
set at four times the idle time on a loaded laptop.

## 1. Per push is deterministic

A test that runs on every push gives the same answer on every machine, under any load. So it never
asserts a wall-clock number. Instead:

- **A budget is tested as a budget.** The AI honours `aibudget=iterations`: the rollouts a search
  reports stay within its iteration budget (`ai/test/budget.test.ts`). Its millisecond budget is
  tested on an **injected clock** (`SessionOptions.now`, `HintOptions.now`) that advances a fixed
  tick per read, so "stops when the clock says the budget is spent" is a count, not a stopwatch.
- **A UI animation queue is tested on a controlled clock.** `vi.useFakeTimers()` fakes `setTimeout`
  and `performance.now`; the real `GameController` plays real AI turns in process and reports
  virtual milliseconds (`app/test/ai-pacing.test.ts`). The worker answers at once in virtual time;
  how long a real worker takes is a budget question (above), not a pacing one.
- **A sleep-and-poll helper is a hang guard.** `until(cond, 25_000)` and `{ timeout: 20_000 }` say
  "this must happen, and if it never does, fail", with room for a loaded runner. They are never a
  bound on how fast.
- **Timeouts are hang guards.** `vi.setConfig({ testTimeout })` is multiplied by
  `TEST_TIMEOUT_SCALE` (default 2) in `test-setup/timeouts.ts`, and `vitest.config.ts` sets 30 s for
  files that set none. Write the idle-machine number the file needs; the scale is the headroom.
- **No `performance.now()` / `Date.now()` in an assertion.** Reading them to *report* (a timing
  block in a JSON file, a console line) is fine.

## 2. Real milliseconds are measured nightly, and never deleted

The product requirements stated in milliseconds stay: the tier budgets in PROMPT (Rookie 10 ms,
Pirate 100, Warlord 1,500, Emperor 5,000, and the app's `BUDGETS[tier].ms`), the hint's p95, the
300-decision review inside 60 s (PLAN row 19), and board.md §5.2 pacing against the real worker.
They run in the nightly workflow behind `TIMING=1`, `REVIEW_GATE=1` and `E2E_FULL=1`
(`npm run test:timing`; the Playwright line in `.github/workflows/nightly.yml`), and they

- **report numbers** to `test-results/` whatever the verdict (`timing-budget.json`,
  `timing-hint.json`, the e2e annotations and console line, `.cache/m8wp7/gate-*.txt`);
- **assert against a generous bound**, about 1.5 times the requirement (2 times for the worker's
  wait on a shared runner), chosen so noise passes and a search twice as slow still fails;
- **say which number is which** in the message: the observed value, the requirement and the bound.

A new wall-clock requirement gets both halves: a deterministic per-push test of the mechanism that
honours it, and a nightly measurement of the number.

## 3. Statistics: a rate over sampled games is a confidence interval

Never `expect(wins / games).toBeGreaterThanOrEqual(p)`, and never a threshold over a handful of
situations (`rate >= 0.8` over 19 activations). Use `ai/test/support/rate.ts`:

```ts
expectRateAtLeast(hits, n, target, { label });   // fails only if the rate is evidently below target
expectRateAtMost(hits, n, target, { label });    // fails only if the rate is evidently above target
expectTalliesMeetThresholds(plan);               // every game-plan tally, all failures reported
```

They fail only when the **one-sided 99% Clopper-Pearson bound** of the observed rate lies wholly on
the wrong side of the target (`ai/test/support/stats.ts`; the Wilson bound at the same confidence
is printed beside it). With the true rate exactly on the line, a check fails at most 1% of the time,
whatever n is (`ai/test/stats.test.ts` proves that by exact enumeration); a rate well past the line
fails with near certainty. Every message prints the observed rate, n, the bound and the target.

What that means in practice, so a threshold is chosen knowing it: a check passes the shortfall that
n cannot distinguish from the target. At n = 12 against 75% it takes 4 wins or fewer to fail; at
n = 200 against 95% it takes 181 or fewer. A gate that must catch a smaller regression needs a
larger n (the nightly's 200 games), not a tighter test. Say in the test which regression its n can
see.

When a sample is small by construction (turns of one review fixture, 9 turns), the same check
applies; if it cannot see what matters, move the requirement to a measurement with a count of its
own instead of lowering the bar.

## 4. Checklist for a new test

1. Does it read a clock? Inject one, or fake timers. If it is a real-time requirement, section 2.
2. Does it compare a rate to a line? Section 3.
3. Does it poll or wait? Give the wait a hang-guard size, not a bound.
4. Does it fail when the behaviour it guards breaks? Apply the mutation (ignore the budget, drop the
   bias, disable compression), see it fail, revert, and record that in the commit or the review.
