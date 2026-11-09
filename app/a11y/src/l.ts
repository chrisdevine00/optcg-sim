/**
 * The L screen-reader script (accessibility.md §11.4), step by step: the coach, the tiered lethal
 * detector, the battle panel, "Count it with me" and the missed-lethal review. Steps 1 to 5 run on
 * the `a11y-l` scenario; steps 6 to 9 start the `lethalDemo` game (the planted missed-lethal game
 * of app/e2e/learning.spec.ts), concede it and open its review. Two re-checks of carried M3
 * findings run first and in the middle: F3 (the skip link) and F15 (`.` after Done on your own
 * effect's pick).
 *
 * Same method as m3.ts: keys go through the reader; where the plain keyboard path does not reach
 * the place a step needs, the harness moves focus itself and records an "assist". Where §11.4
 * expects something that was not built, the step records "Note: not built" and carries on. The
 * verdicts are written by a person (or a subagent) comparing each step's log with its Expect.
 */
import type { Focus, Pass } from './pass.ts';
import {
  answerPlainly,
  arrowTo,
  decide,
  isLeader,
  named,
  toDecision,
  toZone,
  untilMine,
} from './m3.ts';

/** Steps 1 to 5 and the re-checks. Rookie "always blocks or counters a lethal attack" (see the scenario). */
export const L_URL = 'play?scenario=a11y-l&speed=step&opp=rookie&aibudget=iterations&start=1';
/** Steps 6 to 9: the planted missed-lethal game (scenarios.ts `lethalDemo`), as learning.spec.ts plays it. */
export const L_RECORD_URL =
  'play?scenario=lethalDemo&speed=step&opp=pirate&aibudget=iterations&start=1';

const isDry = (p: Pass) => p.reader.name.startsWith('dry');

/** What the coach panel holds right now: mode, tier, headings, lists, the status lines. */
async function coachFacts(p: Pass) {
  return await p.page.evaluate(() => {
    const c = document.querySelector('.coach');
    if (!c) return null;
    const txt = (e: Element) => (e.textContent ?? '').replace(/\s+/g, ' ').trim();
    return {
      mode: c.getAttribute('data-mode') ?? '',
      tier2: !!c.querySelector('[data-testid="tier2"]'),
      tier3: !!c.querySelector('.coach-tier3'),
      guided: !!c.querySelector('.guided'),
      headings: [...c.querySelectorAll('h1,h2,h3,h4')].map((h) => `${h.tagName} ${txt(h)}`),
      lists: [...c.querySelectorAll('ol,ul')].map(
        (l) => `${l.tagName} "${l.getAttribute('aria-label') ?? ''}" ${l.children.length} items`,
      ),
      text: txt(c).slice(0, 700),
    };
  });
}

const polite = async (p: Pass) =>
  (await p.page
    .locator('#announce-polite')
    .textContent({ timeout: 1000 })
    .catch(() => '')) ?? '';

/** Waits (up to `ms`) for the lethal search to settle: its result, or its failure. */
async function coachSettled(p: Pass, ms = 25_000) {
  await p.page
    .locator('.coach-head, .coach-tier3, .coach-checking')
    .first()
    .waitFor({ timeout: ms })
    .catch(() => undefined);
  await p.page
    .locator('.coach-checking')
    .waitFor({ state: 'detached', timeout: ms })
    .catch(() => undefined);
}

/**
 * Presses `L` (the player's key) and checks the coach moved to `tier`. NVDA's browse mode takes
 * letter keys outside the application region, so if the tier did not advance the harness goes back
 * to the board and presses L there, and says so.
 */
async function pressL(p: Pass, tier: 1 | 2 | 3) {
  await p.press('l');
  await coachSettled(p);
  const at = async () => {
    const f = await coachFacts(p);
    return f
      ? f.tier3
        ? 3
        : f.tier2
          ? 2
          : (await p.page.locator('.coach-head').count())
            ? 1
            : 0
      : -1;
  };
  if ((await at()) >= tier) return;
  p.note(`L did not reach tier ${tier} from where focus was (coach tier now ${await at()}).`);
  await p.assist(
    `L was pressed again from the board: the reader or the page did not take it from the coach`,
    async () => {
      await toZone(p, 'my-chars');
    },
  );
  await p.press('l');
  await coachSettled(p);
  if ((await at()) < tier) p.note(`Still not at tier ${tier} (coach tier ${await at()}).`);
}

/** Opens the coach if it is a strip (C toggles it). */
async function ensureCoachOpen(p: Pass) {
  if ((await p.page.locator('.coach').getAttribute('data-mode')) !== 'strip') return;
  await p.press('c');
  await p.page.waitForTimeout(200);
}

/** Tab (then Shift+Tab) to a control in the coach by its accessible name; assists if it cannot. */
async function toCoachControl(p: Pass, re: RegExp, what: string, fallback: string) {
  const inCoach = (f: Focus) => re.test(f.name) || re.test(f.aria);
  const f0 = await p.focus();
  if (inCoach(f0)) return;
  const ok = (await p.until('Tab', inCoach, 16)) ?? (await p.until('Shift+Tab', inCoach, 30));
  if (!ok) await p.assist(`Tab did not reach ${what}`, fallback);
}

export async function runL(p: Pass) {
  const page = p.page;

  // F3 --------------------------------------------------------------------------------------
  await p.step(
    'F3',
    'Re-check F3: Tab from the page top',
    'Load the game; Control+Home; Tab',
    'The skip link "Skip to decision", not the decision heading ("Your Main phase, heading")',
    async () => {
      p.note('Carried from the M3 pass (F3, severity 2): the first Tab stop after Control+Home.');
      await p.press('Control+Home');
      const f = await p.press('Tab');
      const ok = /^Skip to decision/.test(f.name);
      p.note(
        ok
          ? 'F3 re-check: Tab from the page top reached the skip link "Skip to decision".'
          : `F3 re-check FAILED: Tab from the page top reached ${f.aria}, not the skip link.`,
      );
      if (ok) {
        // Enter on the link must move focus to the decision (the re-grade's open question).
        const g = await p.press('Enter');
        p.note(
          `Enter on the skip link: focus ${g.aria}; in the decision panel: ${g.inDecision ? 'yes' : 'NO'}.`,
        );
        await p.reached('the decision panel after Enter on the skip link', g.inDecision);
      } else await p.press('Tab');
    },
  );

  // 1 ---------------------------------------------------------------------------------------
  await p.step(
    '1',
    'Declare an attack; M',
    'Declare an attack with your Leader; M',
    'The battle panel reads attacker power, defender power, the gap, and counters needed (coach tier: none yet; the panel is always on)',
    async () => {
      p.note(
        'Scenario a11y-l: turn 9, your Main Phase. Your Leader (5000) and two Kaido (12000); Rocks at 0 Life with a Character and 2 cards in hand.',
      );
      await toZone(p, 'my-row');
      await arrowTo(p, isLeader, 'your Leader', '[data-zone="my-row"].bc-leader');
      await p.press('a');
      if (!(await p.until('ArrowRight', named(/^Opponent.s Leader/), 8)))
        await p.assist('arrows did not reach their Leader', '[data-zone="opp-row"].bc-leader');
      await p.press('Enter');
      // M: focus to the decision panel (the battle panel), then read it line by line.
      const f = await p.press('m');
      p.note(`After M, focus: ${f.aria}`);
      for (let i = 0; i < 7; i++) await p.press('Browse:Next');
      const text = await p.decisionText();
      p.note(`Battle panel: ${text.slice(0, 700)}`);
      const has = (re: RegExp) => (re.test(text) ? 'yes' : 'NO');
      p.note(
        `Panel carries: attacker power ${has(/Attacker.*\d{4}/)}, defender power ${has(/Defender.*\d{4}/)}, the gap ("need +N to survive") ${has(/need \+\d+/i)}, what they could have (counters) ${has(/What they could have/)}.`,
      );
    },
  );

  // 2 ---------------------------------------------------------------------------------------
  await p.step(
    '2',
    "Confirm the attack; use your Leader's effect and pick its target",
    "Enter to confirm; Use Kaido's [When Attacking]; pick their Character; Done",
    'The confirm is spoken; the optional prompt names the effect; the pick shows its candidate and a count; Done commits',
    async () => {
      // After M focus is on the battle panel's heading and the panel says "Enter to attack". NVDA
      // turns Enter on a heading into a click; the app commits the attack on that click (L-SR1).
      const onHeading = (await p.focus()).id === 'decision-title';
      await p.press('Enter');
      if (await page.locator('#confirm-attack').count()) {
        // Still on the confirm panel: do what a user does who was not told, Tab to the button.
        p.note(
          `Enter${onHeading ? ' on the panel heading' : ''} did not confirm the attack (the panel still reads "${(await p.decisionText()).slice(0, 80)}...").`,
        );
        // An app finding (L-SR1), not a harness failure; recorded so the dry run fails on it.
        await p.reached('the attack confirmed by Enter, as the panel says (L-SR1)', false);
        await decide(p, (f) => f.id === 'confirm-attack', 'Confirm attack', '#confirm-attack');
      }
      await p.reached(
        'the attack confirmed',
        (await page.locator('#confirm-attack').count()) === 0,
      );
      let picked = false;
      if ((await p.kind()) === 'optional') {
        picked = true;
        p.note(`Optional prompt: ${await p.decisionText()}`);
        await decide(p, (f) => f.id === 'use-btn', 'Use', '#use-btn');
      }
      if ((await p.kind()) === 'choose') {
        p.note(`Pick: ${(await p.decisionText()).slice(0, 300)}`);
        await decide(p, (f) => f.inOptions, 'their Character', '#decision .opts button');
        await decide(p, (f) => f.id === 'choose-done', 'Done', '#choose-done');
      } else p.note(`No pick followed; the decision is "${await p.kind()}".`);
      await p.reached('the Use prompt and the pick (an [When Attacking] decision)', picked);
    },
  );

  // F15 -------------------------------------------------------------------------------------
  await p.step(
    'F15',
    'Re-check F15: `.` after Done on your own effect',
    "`.` (next move) right after Done on your own effect's pick",
    '`.` moves the game on ("Rocks.D.Xebec is considering Counters…" then its move), or focus is not stranded on the decision heading',
    async () => {
      p.note(
        'Carried from the M3 pass (F15, severity 2): after Done, focus sat on "Kaido attacks their Leader, heading" and `.` did nothing. Code reading: Step pace only holds the AI (and enables "Next move") after its own Main moves; while it answers your attack it moves on timers, so `.` can have nothing to do there, and the decision panel has no Next move button. The re-check therefore looks first at where focus is, and then at whether `.` changed anything (a change may be the timers).',
      );
      // Kaido's DON!! −1 returned a DON!!, which triggers both Kaido at once: an `order` decision
      // (M3 step 14). Choose the first and let it resolve; what is left is the waiting state.
      for (let i = 0; i < 4 && (await p.kind()) === 'order'; i++) {
        p.note(`Order decision first: ${(await p.decisionText()).slice(0, 160)}`);
        await answerPlainly(p, 'order');
        await page.waitForTimeout(300);
      }
      const before = {
        kind: await p.kind(),
        text: await p.decisionText(),
        live: (await p.live()).length,
        focus: await p.focus(),
      };
      p.note(`Before \`.\`: decision "${before.kind}", focus ${before.focus.aria}`);
      if (!(await p.reached('the game waiting on the AI (F15)', before.kind === 'waiting'))) {
        p.note(
          `The game is not waiting on the AI (decision "${before.kind}"); nothing to re-check.`,
        );
        return;
      }
      const stranded = before.focus.id === 'decision-title';
      await p.press('.');
      await page.waitForTimeout(800);
      const after = {
        kind: await p.kind(),
        text: await p.decisionText(),
        live: (await p.live()).length,
      };
      const moved =
        after.text !== before.text || after.live !== before.live || after.kind !== before.kind;
      const f = await p.focus();
      p.note(
        `F15 re-check: focus was on the decision heading: ${stranded ? 'YES' : 'no'}; \`.\` moved the game: ${moved ? 'yes' : 'NO'} (panel now: ${after.text.slice(0, 120)}); focus after: ${f.aria}. ${
          stranded
            ? `F15 STILL OPEN: focus is stranded on the decision heading${
                isDry(p)
                  ? ' (the dry run has no browse mode, so `.` still works here; under NVDA browse mode takes it)'
                  : moved
                    ? ' (`.` worked this time)'
                    : ' and `.` did nothing'
              }.`
            : moved
              ? 'F15 does not reproduce: focus is on a control (not the heading) and `.` moved the game.'
              : 'Focus is not stranded, but `.` did nothing.'
        }`,
      );
    },
  );

  // 2b --------------------------------------------------------------------------------------
  await p.step(
    '2b',
    'Let the AI defend',
    '`.` once per AI move until it is your Main Phase again',
    'One sentence for its Counter Step with the new totals, for example "Opponent countered +2000; Leader now 7000 vs your 7000. Tied: the attacker wins ties." The battle panel\'s text matches',
    async () => {
      p.note(
        'Note: §11.4 words the Counter sentence with the new totals and the tie rule. As built, the live region speaks the move ("Rocks.D.Xebec: Counter: X.Drake +2000.") and then the result ("You: Attack fails · 5000 vs 7000."); the totals are in the battle panel (defender "5000 + 2000 7000"). Judge against that.',
      );
      let sawAi = false;
      for (let i = 0; i < 12; i++) {
        const k = await p.kind();
        const panel = (await p.decisionText()).slice(0, 220);
        p.note(
          `Before "." ${i + 1}: decision "${k}"; polite: "${await polite(p)}"; panel: ${panel}`,
        );
        if (k === 'waiting') sawAi = true;
        if (k === 'main' || k === 'over') break;
        if (['block', 'counter', 'trigger', 'choose', 'optional', 'order'].includes(k)) {
          await answerPlainly(p, k);
          continue;
        }
        await untilMine(p, 1);
      }
      p.note(`Position afterwards: ${(await p.decisionText()).slice(0, 300)}`);
      await p.reached(
        'the AI having defended and your Main Phase again (2b)',
        (await p.kind()) === 'main' && sawAi,
      );
    },
  );

  // 3 ---------------------------------------------------------------------------------------
  await p.step(
    '3',
    'L, L, L: the three tiers',
    '`L`, `L`, `L`',
    'Coach tier 1: "Lethal: proven, works against any hand" (yes, proven against any hand); tier 2: the number of hits ("You need 1 hit. You have 2 attackers."); tier 3: the line as an ordered list in the coach panel ("You have lethal: 1 hit...")',
    async () => {
      // The coach can only go tall in an idle Main Phase (no battle panel, no pick).
      await p.reached(
        'an idle Main Phase for the coach (3)',
        (await p.kind()) === 'main' && (await page.locator('#confirm-attack').count()) === 0,
      );
      await toZone(p, 'my-chars');
      await pressL(p, 1);
      p.note(
        `Tier 1: ${(
          await page
            .locator('.coach-tiers')
            .innerText()
            .catch(() => '')
        ).replace(/\s+/g, ' ')}; polite: "${await polite(p)}"; focus ${(await p.focus()).aria}`,
      );
      await pressL(p, 2);
      p.note(
        `Tier 2: ${
          (await page
            .locator('[data-testid="tier2"]')
            .textContent()
            .catch(() => '')) ?? ''
        }`,
      );
      await pressL(p, 3);
      const f = await coachFacts(p);
      p.note(
        `Tier 3 (coach mode "${f?.mode}"): lists: ${f?.lists.join('; ')}; headings: ${f?.headings.join('; ')}`,
      );
      p.note(`Focus after the third L: ${(await p.focus()).aria}`);
      await p.reached('tier 3 with the coach tall (3)', f?.tier3 === true && f.mode === 'tall');
    },
  );

  // 4 ---------------------------------------------------------------------------------------
  await p.step(
    '4',
    'C; read the coach with the virtual cursor',
    '`C`; read the panel with the virtual cursor (browse mode) or VO navigation',
    "Browse mode works there; headings and lists are present (the coach is outside the board's application region); coach tier 3 shows the claim as a heading and the line as an ordered list",
    async () => {
      // C toggles: the coach is open at tier 3 (tall), so C collapses it and the second C opens it.
      const f1 = await p.press('c');
      const m1 = await page.locator('.coach').getAttribute('data-mode');
      p.note(`First C: coach is "${m1}"; focus ${f1.aria}`);
      if (m1 === 'strip') {
        const f2 = await p.press('c');
        const m2 = await page.locator('.coach').getAttribute('data-mode');
        p.note(`Second C: coach is "${m2}"; focus ${f2.aria}`);
      }
      await ensureCoachOpen(p);
      const facts = await coachFacts(p);
      p.note(
        `Coach structure: ${facts?.headings.length ?? 0} headings (${facts?.headings.join('; ')}); ${facts?.lists.length ?? 0} lists (${facts?.lists.join('; ')})`,
      );
      // Read it as a browse-mode user does: lines, then the next heading, the next list.
      // The board is an application region (arrow keys go to the page), so a user Tabs to the
      // coach, which is outside it, and reads there.
      const inCoach = () => page.evaluate(() => !!document.activeElement?.closest('.coach'));
      if (!(await inCoach())) {
        p.note(
          'C does not move focus: it stays where it was (on the board). Tabbing to the coach to read it.',
        );
        const here = (f: Focus) => f.tag !== 'body' && f.id !== 'decision-title' && f.inCoach;
        if (!(await p.until('Tab', here, 16))) await p.until('Shift+Tab', here, 30);
        if (!(await inCoach())) await p.assist('Tab did not reach the coach', '.coach-result');
      }
      p.note(`Reading from: ${(await p.focus()).aria}`);
      for (let i = 0; i < 6; i++) await p.press('Browse:Next');
      await p.press('Browse:Heading');
      await p.press('Browse:Heading');
      await p.press('Browse:List');
      if (isDry(p))
        p.note('Dry run: no virtual cursor; the structure above is what the cursor would find.');
    },
  );

  // 4b --------------------------------------------------------------------------------------
  await p.step(
    '4b',
    'Count it with me: the first question',
    'Tab to "Count it with me", Enter; read question 1; answer it wrongly, then rightly; Check my count',
    'Coach tier: guided count (tall). "Count it with me, heading"; focus on question 1 "How many hits do you need?"; the number field is labelled "Hits needed"; Check my count is read as a status ("✓ ...1 Life..." or "✕ ...")',
    async () => {
      await toCoachControl(p, /^Count it with me/, '"Count it with me"', '.coach-actions button');
      await p.press('Enter');
      await page.waitForTimeout(400);
      const f = await p.focus();
      p.note(`After Enter, focus: ${f.aria}`);
      await p.reached(
        'the guided count with the coach tall (4b)',
        (await page.locator('.guided').count()) > 0 &&
          (await page.locator('.coach').getAttribute('data-mode')) === 'tall',
      );
      if (!/How many hits/.test(f.name) && !/How many hits/.test(f.aria))
        await p.assist('focus was not on question 1', '.guided-q');
      for (let i = 0; i < 3; i++) await p.press('Browse:Next');
      // The number field.
      await toCoachControl(p, /Hits needed/, 'the "Hits needed" field', '.guided-field input');
      await page.locator('.guided-field input').fill('');
      await p.press('3');
      await toCoachControl(p, /^Check my count/, 'Check my count', '.guided-nav .primary');
      await p.press('Enter');
      p.note(
        `Wrong answer (3): ${await page
          .locator('.guided-check')
          .textContent()
          .catch(() => '(no check)')}`,
      );
      await toCoachControl(p, /Hits needed/, 'the "Hits needed" field', '.guided-field input');
      await page.locator('.guided-field input').fill('');
      await p.press('1');
      await toCoachControl(p, /^Check my count/, 'Check my count', '.guided-nav .primary');
      await p.press('Enter');
      const right = await page
        .locator('.guided-check')
        .textContent()
        .catch(() => '(no check)');
      p.note(`Right answer (1): ${right}`);
      await p.reached('a right answer to question 1 (4b)', /✓/.test(right ?? ''));
    },
  );

  // 4c --------------------------------------------------------------------------------------
  await p.step(
    '4c',
    'Count it with me: questions 2 to 4, then Close',
    'Next; pick the two Kaido; Next; read what they can stop; Next; split the DON!!; Check my count; Close',
    'Each Next moves focus to the next question and says "Question N: ..." politely; the cards are toggle buttons ("Kaido 12000, toggle button, pressed"); the split is a table; each Check my count is read; Close returns focus inside the coach, never to the decision heading',
    async () => {
      const inCoach = async () =>
        (await p.focus()).tag !== 'body' &&
        (await p.page.evaluate(() => !!document.activeElement?.closest('.coach')));
      const next = async () => {
        await toCoachControl(p, /^Next/, 'Next', '.guided-nav button:nth-child(2)');
        await p.press('Enter');
        await page.waitForTimeout(400);
        p.note(
          `Question now: "${
            (await page
              .locator('.guided-q')
              .textContent()
              .catch(() => '?')) ?? '?'
          }"; focus ${(await p.focus()).aria}; in the coach: ${await inCoach()}`,
        );
      };
      await next(); // 2
      // Pick the cards (Space on each toggle).
      for (const re of [/Kaido/, /Kaido/]) {
        await toCoachControl(p, re, 'a Kaido toggle', '.opts button:not([aria-pressed="true"])');
        await p.press(' ');
        await p.press('Tab');
      }
      await toCoachControl(p, /^Check my count/, 'Check my count', '.guided-nav .primary');
      await p.press('Enter');
      p.note(
        `Question 2 check: ${await page
          .locator('.guided-check')
          .textContent()
          .catch(() => '(none)')}`,
      );
      await next(); // 3
      for (let i = 0; i < 4; i++) await p.press('Browse:Next');
      await next(); // 4
      const more = page.getByRole('button', { name: /^More DON!! for/ }).first();
      if (await more.count()) {
        for (let i = 0; i < 2; i++) {
          await toCoachControl(
            p,
            /^More DON!! for/,
            'More DON!!',
            '.guided-don button:nth-of-type(2)',
          );
          await p.press('Enter');
        }
      }
      await toCoachControl(p, /^Check my count/, 'Check my count', '.guided-nav .primary');
      await p.press('Enter');
      p.note(
        `Question 4 check: ${await page
          .locator('.guided-check')
          .textContent()
          .catch(() => '(none)')}`,
      );
      await toCoachControl(p, /^Close/, 'Close', '.guided-nav button:last-child');
      const f = await p.press('Enter');
      p.note(
        `After Close, focus: ${f.aria}; on the decision heading: ${f.id === 'decision-title' ? 'YES (stranded)' : 'no'}`,
      );
      await p.reached(
        'questions 2 to 4 answered and the count closed (4c)',
        /✓/.test(
          (await page
            .locator('.guided-check')
            .textContent()
            .catch(() => '')) ?? '',
        ) || (await page.locator('.guided').count()) === 0,
      );
      p.note(
        'Nothing was played: the guided count is a table in the coach (its board sandbox is not built, DECISIONS 2026-11-05).',
      );
    },
  );

  // 5 ---------------------------------------------------------------------------------------
  await p.step(
    '5',
    'The lethal detector: silent, then on',
    'Leave the detector off and wait; turn it on; play on to a position where it changes',
    'Silent by default; with the detector on (Coach tier "Tier 2 always on"), one polite line ("You need 1 hit. You have 2 attackers.") and a badge on the Lethal button; after a move the line is given again only if it changed',
    async () => {
      p.note(
        'Note: not built — there is no "Coach alerts" setting and no "Lethal available" line (DECISIONS 2026-11-05 "L UI"; learning-ui §3.1 defines the Detector levels instead). The equivalent is the coach\'s Detector setting: "Tier 1 always on" or "Tier 2 always on", which badges the Lethal button and speaks one polite tier line per check. Judge against that.',
      );
      await ensureCoachOpen(p);
      // Silent by default: nothing is written to the live regions while the detector is off.
      const t0 = Date.now();
      await page.waitForTimeout(3000);
      const quiet = (await p.live()).filter((l) => l.t >= t0);
      p.note(
        `Detector off, 3 s idle: ${quiet.length} live-region writes ${quiet.length ? JSON.stringify(quiet.map((q) => q.text)) : '(silent)'}.`,
      );
      // Turn it on: the select, ArrowDown twice (Ask me → Tier 1 → Tier 2).
      await toCoachControl(p, /Detector/, 'the Detector select', '.coach-setting select');
      p.note(`On the detector setting: ${(await p.focus()).aria}`);
      await p.press('ArrowDown');
      await p.press('ArrowDown');
      // On macOS, ArrowDown opens a native select's list instead of changing it (Windows changes
      // it in place), so the dry run on a Mac needs the harness to make the choice.
      if (
        (await page
          .locator('.coach-setting select')
          .inputValue()
          .catch(() => '')) !== '2'
      ) {
        await p.assist(
          'ArrowDown did not change the Detector select (macOS opens its list); chose "Tier 2 always on" directly',
          async () => {
            await page.keyboard.press('Escape').catch(() => undefined);
            await page.locator('.coach-setting select').selectOption('2');
          },
        );
      }
      await page.waitForTimeout(1500);
      await p.reached(
        'the detector on (5)',
        (await page
          .locator('.coach-setting select')
          .inputValue()
          .catch(() => '')) === '2',
      );
      p.note(
        `Detector now: ${await page
          .locator('.coach-setting select')
          .inputValue()
          .catch(() => '?')}; badge: ${
          (await page
            .locator('[data-testid="lethal-badge"]')
            .textContent()
            .catch(() => '(none)')) ?? '(none)'
        }; polite: "${await polite(p)}"`,
      );
      // Play on: give 1 DON!! to the first Kaido, which changes the position.
      await p.assist('focus moved to the board to play on (a user Tabs back to it)', async () => {
        await toZone(p, 'my-chars');
      });
      const f = await p.press('+');
      if (f.inDialog || (await page.locator('dialog[open], [role="dialog"]').count())) {
        await p.press('Enter');
      } else p.note(`+ did not open the DON!! count dialog; focus ${f.aria}`);
      await page.waitForTimeout(2500);
      p.note(
        `After a move: badge ${
          (await page
            .locator('[data-testid="lethal-badge"]')
            .textContent()
            .catch(() => '(none)')) ?? '(none)'
        }; polite: "${await polite(p)}"; focus ${(await p.focus()).aria}`,
      );
      const writes = (await p.live()).filter((l) => l.t >= t0 && /hit|Lethal|lethal/.test(l.text));
      p.note(
        `Detector lines written since: ${JSON.stringify(writes.map((w) => `${w.region}: ${w.text}`))}`,
      );
    },
  );

  // ---------------------------------------------------------------------------------------
  // Steps 6 to 9: a fresh game, the planted missed-lethal record.
  // ---------------------------------------------------------------------------------------
  let toReview = false;
  const loadRecord = async () => {
    await page.goto(L_RECORD_URL);
    await page.locator('#decision').waitFor({ timeout: 30_000 });
    await page.waitForTimeout(1500);
    // After a goto the page may not have keyboard focus (Firefox left it in the toolbar, so every
    // key of steps 6 to 9 went to the browser in the r1 run).
    await p.focusPage('after the reload on the planted record');
    // The planted record: the game of learning.spec.ts. At turn 9 you hold lethal (4 DON!! on the
    // Leader, then the Leader, then Kaido). The script does not play it: it concedes, so the
    // review flags the missed lethal.
    await p.assist(
      'harness focuses the Game menu button (a user Tabs to it)',
      'button[aria-label="Game menu"]',
    );
    await p.press('Enter');
    if (!(await p.until('ArrowDown', named(/^Concede/), 8)))
      await p.assist('the Concede item was not reached', '[role="menuitem"]:has-text("Concede")');
    await p.press('Enter');
    if (!(await p.until('Tab', (f) => f.name === 'Concede', 6)))
      await p.assist(
        'the Concede button was not reached',
        'dialog button:has-text("Concede"), [role="dialog"] button:has-text("Concede")',
      );
    await p.press('Enter');
    await page.locator('#decision[data-kind="over"]').waitFor({ timeout: 15_000 });
    toReview = true;
  };

  await p.step(
    '6',
    'Open the review of the planted record',
    'Reload on the planted missed-lethal game, concede it, "Review this game"; the timeline; `N` to the flag',
    'The timeline toolbar; `N` to the flag; the flag\'s text with its certainty label ("Holds whatever they held")',
    async () => {
      p.note(
        'How the record is reached: the script loads scenario lethalDemo (turn 9, lethal on the board), concedes through the Game menu, then opens "Review this game". That is the same game learning.spec.ts flags as a severe missed lethal; no finished-game URL exists.',
      );
      await loadRecord();
      if (!(await p.until('Tab', (f) => f.id === 'review-btn', 14)))
        await p.assist('Tab did not reach "Review this game"', '#review-btn');
      await p.press('Enter');
      await page
        .getByTestId('review-status')
        .filter({ hasText: /flag|no missed lethal/ })
        .waitFor({ timeout: 40_000 });
      await page.waitForTimeout(800);
      const status = (await page.getByTestId('review-status').textContent()) ?? '';
      p.note(`Status: ${status}`);
      await p.reached('the review with a flag (6)', /flag/.test(status));
      p.note(
        'Note: not built as written — the timeline is a list of turn buttons ("Turns, left to right"), not an ARIA toolbar; Left and Right move between turns, N and Shift+N between flags.',
      );
      // The timeline: the first turn button, then Right until the flagged turn.
      await p.assist(
        'focus moved to the Turn timeline (a user Tabs past the header)',
        '.tl button.tl-col',
      );
      const f = await p.focus();
      p.note(`On the timeline: ${f.aria}`);
      for (let i = 0; i < 4; i++) await p.press('ArrowRight');
      const n = await p.press('n');
      p.note(
        `After N, focus: ${n.aria}. N selects the next flag (with one flag it stays); the review says which in its own live region: "${
          (await page
            .getByTestId('review-announce')
            .textContent({ timeout: 1000 })
            .catch(() => '')) ?? ''
        }".`,
      );
      // The flag's text: the Flags table row and the selected-flag section.
      await p.until('Tab', (x) => /missed lethal/i.test(x.name), 14);
      for (let i = 0; i < 6; i++) await p.press('Browse:Next');
      const detail = await page
        .getByTestId('selected-flag')
        .innerText()
        .catch(() => '');
      p.note(`Selected flag text: ${detail.replace(/\s+/g, ' ').slice(0, 600)}`);
      const row = await page
        .locator('.rv-table tbody tr')
        .first()
        .innerText()
        .catch(() => '');
      p.note(`Flag row (turn, kind, severity, certainty): ${row.replace(/\s+/g, ' ')}`);
    },
  );

  await p.step(
    '7',
    'Enter on the flag: Study',
    'Enter on the flag, then "Study this moment"; Q',
    'The board restores read-only; focus moves to the explanation; `Q` reads the restored position',
    async () => {
      if (!(await p.reached('the review of the planted record (7)', toReview)))
        return 'not reached';
      // The flag button in the table selects it; Study is its own button below the explanation.
      const flagBtn = (f: Focus) => /missed lethal/i.test(f.name);
      if (!flagBtn(await p.focus())) await p.until('Shift+Tab', flagBtn, 30);
      await p.press('Enter');
      p.note(
        'Note: not built as written — Enter on the flag only selects it (it is already selected); Study opens from the "Study this moment" button in the selected-flag section.',
      );
      if (!(await p.until('Tab', (f) => f.id === 'study-btn', 30)))
        await p.assist('Tab did not reach "Study this moment"', '#study-btn');
      await p.press('Enter');
      await page.getByTestId('study-rail').waitFor({ timeout: 15_000 });
      await page.waitForTimeout(600);
      const f = await p.focus();
      p.note(
        `Focus after Study opens: ${f.aria}. Note: §11.4 says focus moves to the explanation; as built it moves to the "← Overview" button at the top of the Study rail, with the explanation just below it.`,
      );
      p.note(
        `Study rail: ${(await page.getByTestId('study-rail').innerText()).replace(/\s+/g, ' ').slice(0, 500)}`,
      );
      // Q on the restored board.
      await p.assist('focus moved to the restored board (a user Tabs into it)', async () => {
        await toZone(p, 'my-row').catch(() => undefined);
      });
      if (!(await p.focus()).inBoard)
        await p.assist('Tab did not reach the board in Study', '[data-zone="my-row"][data-item]');
      await p.press('q');
      p.note(`Q said: "${await polite(p)}"`);
    },
  );

  await p.step(
    '8',
    'Practice this',
    '"Practice this"',
    'The puzzle opens; untimed; the board model is unchanged (same board region and zones as a game)',
    async () => {
      if (!(await p.reached('the review of the planted record (8)', toReview)))
        return 'not reached';
      if (!(await p.until('Tab', (f) => f.id === 'practice-btn', 40)))
        await p.until('Shift+Tab', (f) => f.id === 'practice-btn', 40);
      if ((await p.focus()).id !== 'practice-btn')
        await p.assist('Tab did not reach "Practice this"', '#practice-btn');
      await p.press('Enter');
      await page.locator('#decision[data-kind="main"]').waitFor({ timeout: 20_000 });
      await page.waitForTimeout(600);
      p.note(
        `Chip: ${
          (await page
            .getByTestId('puzzle-chip')
            .textContent()
            .catch(() => '(none)')) ?? '(none)'
        }; focus ${(await p.focus()).aria}`,
      );
      p.note(
        `Untimed: ${(await page.locator('[role="timer"], .timer, [data-testid="timer"]').count()) === 0 ? 'no timer or countdown anywhere on the page' : 'A TIMER IS PRESENT'}.`,
      );
      p.note(
        `Board model: application region ${(await page.locator('.board[role="application"], [role="application"] .board, .board').count()) ? 'present' : 'MISSING'}; zones: ${await page.locator('[data-zone]').evaluateAll((e) => [...new Set(e.map((x) => (x as HTMLElement).dataset.zone))].join(', '))}.`,
      );
      p.note(`Decision panel: ${(await p.decisionText()).slice(0, 300)}`);
    },
  );

  await p.step(
    '9',
    'Answer with the line',
    'Play the line: 4 DON!! on the Leader, the Leader attacks, then Kaido attacks; or "Declare no lethal"',
    'The result and the explanation are announced politely and are readable in a document region ("Solved: you won on the turn it was cut from"; chip "Practice · solved")',
    async () => {
      if (!(await p.reached('the practice board (9)', toReview))) return 'not reached';
      p.note(
        'Note: not built — there is no "Declare no lethal" control; the puzzle is answered only by playing the line (DECISIONS 2026-11-05).',
      );
      // 4 DON!! on the Leader.
      await toZone(p, 'my-row');
      await arrowTo(p, isLeader, 'your Leader', '[data-zone="my-row"].bc-leader');
      const f = await p.press('+');
      if (f.inDialog || (await page.locator('dialog[open], [role="dialog"]').count())) {
        for (let i = 0; i < 3; i++) await p.press('ArrowUp');
        await p.press('Enter');
      } else p.note(`+ did not open the count dialog; focus ${f.aria}`);
      const attack = async (
        zone: string,
        pred: (f: Focus) => boolean,
        what: string,
        sel: string,
      ) => {
        await toZone(p, zone);
        await arrowTo(p, pred, what, sel);
        await p.press('a');
        if (!(await p.until('ArrowRight', named(/^Opponent.s Leader/), 8)))
          await p.assist('arrows did not reach their Leader', '[data-zone="opp-row"].bc-leader');
        await p.press('Enter');
        await p.press('Enter');
        for (let i = 0; i < 30; i++) {
          const k = await untilMine(p, 6);
          if (k === 'main' || k === 'over') break;
          await answerPlainly(p, k);
        }
      };
      await attack('my-row', isLeader, 'your Leader', '[data-zone="my-row"].bc-leader');
      if ((await p.kind()) === 'main')
        await attack('my-chars', named(/Kaido/), 'Kaido', '[data-zone="my-chars"][data-item]');
      await page.waitForTimeout(1000);
      const result = await page
        .getByTestId('puzzle-result')
        .textContent({ timeout: 8000 })
        .catch(() => null);
      p.note(
        `Puzzle result: ${result ?? '(none shown)'}; chip: ${
          (await page
            .getByTestId('puzzle-chip')
            .textContent()
            .catch(() => '?')) ?? '?'
        }`,
      );
      p.note(
        `Where the result lives: ${await page
          .getByTestId('puzzle-result')
          .evaluate(
            (e) =>
              `${e.tagName.toLowerCase()} inside ${e.closest('[role]')?.getAttribute('role') ?? 'no role'} (${e.closest('#decision') ? 'the decision panel' : 'elsewhere'})`,
          )
          .catch(() => 'n/a')}; polite: "${await polite(p)}"`,
      );
      if (!(await p.reached('the puzzle solved (9)', !!result))) return 'not reached';
      await toDecision(p);
    },
  );
}
