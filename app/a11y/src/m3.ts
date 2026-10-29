/**
 * The M3 screen-reader script (accessibility.md §11.3), step by step, on the `a11y-m3` scenario.
 * Keys go through the reader (NVDA on the runner). Where the plain keyboard path does not reach
 * the place a step needs, the harness moves focus itself and records an "assist", so a pass that
 * needed one is visible in the record. The pass/fail verdicts are written by a person (or a
 * subagent) comparing each step's log with its Expect column, not by this script.
 */
import type { Pass, Focus } from './pass.ts';

export const M3_URL = 'play?scenario=a11y-m3&speed=step&start=1';

const isLeader = (f: Focus) => /^Your Leader\b/.test(f.name);
const named = (re: RegExp) => (f: Focus) => re.test(f.name) || re.test(f.aria);
const zoneIs = (z: string) => (f: Focus) => f.zone === z && f.inBoard;
const HUMAN = new Set([
  'main',
  'block',
  'counter',
  'trigger',
  'choose',
  'optional',
  'order',
  'mulligan',
  'chooseFirst',
]);

/** Board zones in Tab order (accessibility.md §3.1); the decision panel and rail come after. */
const ZONES = ['opp-id', 'opp-row', 'opp-chars', 'mid', 'my-chars', 'my-row', 'hand'];

/**
 * Moves focus into the board's `zone` by Tab or Shift+Tab, whichever is shorter from where focus
 * is, as a keyboard user would (never Tabbing out of the page into the browser's own controls).
 */
async function toZone(p: Pass, zone: string) {
  const f = await p.focus();
  if (f.inBoard && f.zone === zone) return;
  // From <body> (focus lost) the browser resumes from where focus was, usually the decision panel.
  const here = f.inBoard ? ZONES.indexOf(f.zone) : ZONES.length;
  const first = here > ZONES.indexOf(zone) ? 'Shift+Tab' : 'Tab';
  const second = first === 'Tab' ? 'Shift+Tab' : 'Tab';
  if (await p.until(first, zoneIs(zone), 14)) return;
  if (await p.until(second, zoneIs(zone), 22)) return;
  await p.assist(`Tab did not reach the ${zone} zone`, `[data-zone="${zone}"][data-item]`);
}

/** Arrows within the focused zone until `pred` holds; tries right, then left. */
async function arrowTo(p: Pass, pred: (f: Focus) => boolean, what: string, selector?: string) {
  if (await p.until('ArrowRight', pred, 10)) return;
  if (await p.until('ArrowLeft', pred, 10)) return;
  if (selector) await p.assist(`arrows did not reach ${what}`, selector);
  else throw new Error(`arrows did not reach ${what}`);
}

/** Focus into the decision panel: `P` from the board (the documented key), else the harness. */
async function toDecision(p: Pass) {
  let f = await p.focus();
  if (f.inDecision) return;
  if (f.inBoard) {
    f = await p.press('p');
    if (f.inDecision) return;
    p.note(`P from the board left focus on: ${f.aria}`);
  }
  await p.assist('focus was outside the board and the decision panel', '#decision-title');
}

/** Tab inside the decision panel to the control `pred` matches, then press `key` on it. */
async function decide(
  p: Pass,
  pred: (f: Focus) => boolean,
  what: string,
  fallback: string,
  key = 'Enter',
) {
  await toDecision(p);
  let f = await p.focus();
  // Forward through the panel; if that leaves it, back again from its end.
  for (let i = 0; i < 25 && !pred(f) && f.inDecision; i++) f = await p.press('Tab');
  if (!pred(f)) {
    let entered = f.inDecision;
    for (let i = 0; i < 30 && !pred(f); i++) {
      f = await p.press('Shift+Tab');
      if (f.inDecision) entered = true;
      else if (entered) break;
    }
  }
  if (!pred(f)) await p.assist(`Tab did not reach ${what} in the decision panel`, fallback);
  await p.press(key);
}

/** Step pace: presses `.` until the player owes a decision (or the game ends). */
async function untilMine(p: Pass, max = 40): Promise<string> {
  for (let i = 0; i < max; i++) {
    const k = await p.kind();
    if (HUMAN.has(k) || k === 'over') return k;
    const f = await p.focus();
    const before = `${k}|${(await p.live()).length}|${p.reader.heardSince(0).length}`;
    if (f.inBoard) await p.press('.');
    else if (!deadDot && f.inDecision) {
      // The panel prints "." on its Next move button; try the key where focus is first.
      await p.press('.');
      const after = `${await p.kind()}|${(await p.live()).length}|${p.reader.heardSince(0).length}`;
      if (after === before && (await p.kind()) === 'waiting') {
        deadDot = true;
        p.note(
          `"." did nothing with focus on ${f.aria} (in the decision panel, outside the board's application region). From here the script presses Enter on that button, as a user would.`,
        );
      }
    } else if (/^Next move|^Skip to my decision/.test(f.name)) {
      await p.press('Enter');
    } else {
      // `.` is a board key; a user would come back to the board first.
      await toZone(p, 'hand');
      await p.press('.');
    }
    await p.page.waitForTimeout(150);
  }
  return await p.kind();
}

/** Set once "." has been seen to do nothing in the decision panel (the reader took the key). */
let deadDot = false;

const gameOver = async (p: Pass) =>
  (await p.live()).some((l) => /game over|you win|you lose/i.test(l.text)) ||
  (await p.kind()) === 'over';

/** Answers whatever small decision is open in the plainest way (Skip, take the hit, first option). */
async function answerPlainly(p: Pass, k: string) {
  if (!HUMAN.has(k)) return;
  if (k === 'optional') return decide(p, (f) => f.id === 'skip-btn', 'Skip', '#skip-btn');
  if (k === 'trigger')
    return decide(p, named(/^Activate Trigger/), 'Activate Trigger', '#decision .dec-foot button');
  if (k === 'block' || k === 'counter') {
    // A hit that cannot land still offers a primary; "Take the hit" is always there.
    return decide(p, (f) => f.id === 'take-hit', 'Take the hit', '#take-hit');
  }
  if (k === 'order')
    return decide(p, (f) => f.inOptions, 'the first effect', '#decision .dec-list button');
  if (k === 'choose') {
    // Card picks commit with Done; a named option (a DON!! location, a mode) acts at once.
    if (await p.page.locator('#choose-done').count())
      return decide(p, (f) => f.id === 'choose-done', 'Done / Choose none', '#choose-done');
    return decide(p, (f) => f.inOptions, 'the first option', '#decision .opts button');
  }
  throw new Error(`No plain answer for a "${k}" decision`);
}

export async function runM3(p: Pass) {
  // 1 ---------------------------------------------------------------------------------------
  await p.step(
    '1',
    'Load the game; Tab from the page top',
    'Load the game; press Tab from the page top',
    'Skip link "Skip to decision"; then the board\'s name "Game board, turn 1, your Main Phase" and its role description',
    async () => {
      p.note('The scenario starts on turn 3 (see a11y-scenarios.ts), so the board reads "turn 3".');
      await p.press('Tab');
      await p.press('Tab');
    },
  );

  // 2 ---------------------------------------------------------------------------------------
  await p.step(
    '2',
    'Tab through every zone',
    'Tab through every zone',
    'Each zone in §3.1 order, with its name and count; empty zones say "empty"; the decision panel comes right after your hand',
    async () => {
      const f = await p.until('Tab', (x) => x.name === 'Game log' || /\blog\b/.test(x.aria), 24);
      if (!f) p.note('Tab did not reach the game log within 24 presses.');
    },
  );

  // 3 ---------------------------------------------------------------------------------------
  await p.step('3', 'Status summary', 'Q', 'The status summary (§9.2)', async () => {
    await toZone(p, 'hand');
    await p.press('q');
  });

  // 4 ---------------------------------------------------------------------------------------
  await p.step(
    '4',
    'Hand, inspector',
    'Your hand: arrows; I on a card; Escape',
    "Each card's name and playable state; the inspector opens with full text; focus returns to the card",
    async () => {
      await p.press('Home');
      const n = await p.page.locator('[data-zone="hand"][data-item]').count();
      for (let i = 1; i < n; i++) await p.press('ArrowRight');
      await p.press('Home');
      await p.press('ArrowRight'); // X.Drake
      await p.press('i');
      await p.press('Escape');
    },
  );

  // 5 ---------------------------------------------------------------------------------------
  await p.step(
    '5',
    'Play a Character',
    'Enter on a playable Character; choose Play',
    'Menu items with costs; after playing: "Played Nami, rested 2 DON!!." Focus is on the new card or the hand',
    async () => {
      let f = await p.focus();
      if (f.zone !== 'hand') await toZone(p, 'hand');
      await p.press('Home');
      await arrowTo(p, named(/Black Maria/), 'Black Maria');
      f = await p.press('Enter');
      if (f.aria.includes('menuitem')) {
        await p.press('ArrowDown');
        await p.press('ArrowUp');
      } else p.note(`Enter did not open the action menu; focus: ${f.aria}`);
      f = await p.focus();
      if (!/Play/.test(f.name))
        await p.assist('the Play item was not focused', '[role="menuitem"]');
      await p.press('Enter');
    },
  );

  // 6 ---------------------------------------------------------------------------------------
  await p.step(
    '6',
    'Give DON!! to the Leader',
    '+ on your Leader; Up twice; Enter',
    'Count dialog "1 of N"; "3: Leader 8000"; "Gave 3 DON!! to Leader. Leader 8000."',
    async () => {
      await toZone(p, 'my-row');
      await arrowTo(p, isLeader, 'your Leader', '[data-zone="my-row"].bc-leader');
      await p.press('+');
      await p.press('ArrowUp');
      await p.press('ArrowUp');
      await p.press('Enter');
    },
  );

  // 7 ---------------------------------------------------------------------------------------
  await p.step(
    '7',
    'Attack with a Character played this turn',
    'A on a Character played this turn',
    '"Nami can\'t attack: it was played this turn." No dialog',
    async () => {
      const f = await p.focus();
      if (f.zone !== 'my-chars') await toZone(p, 'my-chars');
      await arrowTo(p, named(/Black Maria/), 'Black Maria');
      await p.press('a');
    },
  );

  // 8 ---------------------------------------------------------------------------------------
  await p.step(
    '8',
    'End turn; Rookie plays at Step pace',
    'E, then confirm; let Rookie play its turn at Step pace, pressing . for each move',
    'One sentence per AI move; the end-of-turn summary',
    async () => {
      await p.press('e');
      if ((await p.kind()) === 'main') {
        p.note('E did not end the turn at once; looking for a confirmation.');
        await p.press('Enter');
      }
      const k = await untilMine(p);
      p.note(`First decision of yours in Rookie's turn: ${k}.`);
    },
  );

  // 9 ---------------------------------------------------------------------------------------
  await p.step(
    '9',
    'Attacked: the defence planner',
    'When attacked: the defence planner',
    'Focus moves to it; the heading reads the attack; Blockers listed with previews; the primary reads "Take the hit" and Enter alone does not commit it',
    async () => {
      for (let i = 0; i < 12; i++) {
        const k = await untilMine(p);
        const f = await p.focus();
        p.note(`Decision "${k}" arrived; focus was on: ${f.aria}`);
        if (k === 'block' || k === 'counter') break;
        if (k === 'optional') {
          p.note(`Optional prompt before the defence: ${await p.decisionText()}. Answered Skip.`);
          await answerPlainly(p, k);
          continue;
        }
        if (k === 'main' || k === 'over') return 'not reached';
        await answerPlainly(p, k);
      }
      const text = await p.decisionText();
      p.note(`Planner text: ${text.slice(0, 400)}`);
      // Enter alone must not commit "Take the hit" (from the heading, where focus should be).
      const f = await p.focus();
      if (f.id !== 'decision-title') p.note('Focus was not on the planner heading.');
      await p.press('Enter');
      p.note(`After Enter the decision is still "${await p.kind()}".`);
      // Hear the Blockers and Counters.
      await p.until('Tab', named(/^No block/), 6);
      for (let i = 0; i < 3; i++) await p.press('Tab');
      await p.until('Shift+Tab', named(/^No block/), 6);
    },
  );

  // 10 and 11 ------------------------------------------------------------------------------
  // Rookie's attacks come in an order fixed by the seed and the script's moves, but that order
  // has differed between the dry run and NVDA (the hit with a [Trigger] can come first). So the
  // step that matches the open attack runs first, and the other waits for its attack.
  const isTen = async () => /Need \+3000/.test(await p.decisionText());
  let finished = false;
  const finishTurn = async () => {
    for (let i = 0; i < 20; i++) {
      const k = await untilMine(p);
      if (k === 'main' || k === 'over') break;
      p.note(`Then "${k}"; focus: ${(await p.focus()).aria}`);
      await answerPlainly(p, k);
    }
    finished = true;
  };
  const ten = () =>
    p.step(
      '10',
      'Stage Counters',
      'Choose "No block"; stage one counter that ties; check the footer; stage a second; change one counter\'s target; Enter',
      'After the first Space: the tie wording and a footer of "Take the hit" (primary) and "Play anyway · still hits"; after the second: "Counter plus 3000, survive" as the primary; Enter plays the counters; then the result',
      async () => {
        // Wait for the 7000-against-5000 attack, answering anything else plainly.
        for (let i = 0; i < 20; i++) {
          const k = await untilMine(p);
          if (k === 'main' || k === 'over') return 'not reached';
          if ((k === 'block' || k === 'counter') && (await isTen())) break;
          p.note(`Before the 7000 attack: "${k}"; focus: ${(await p.focus()).aria}`);
          await answerPlainly(p, k);
        }
        p.note(`Planner: ${(await p.decisionText()).slice(0, 300)}`);
        await decide(p, named(/^No block/), 'No block', '#decision [aria-pressed]', ' ');
        await decide(
          p,
          named(/Drake \+2000/),
          'X.Drake +2000',
          '#decision [aria-label*="Drake"]',
          ' ',
        );
        // The footer, in Tab order.
        await p.until('Tab', (f) => f.id === 'take-hit', 8);
        await p.until('Shift+Tab', named(/^Yamato \+1000/), 8);
        await p.press(' ');
        p.note(
          'No control changes one staged Counter\'s target: staged Counters all go to the defender (the Leader, or the staged Blocker). "Change one counter\'s target" is not built.',
        );
        await p.until('Tab', named(/^Counter \+3000/), 8);
        const f = await p.focus();
        if (!/^Counter \+3000/.test(f.name))
          await p.assist(
            'Tab did not reach the Counter primary',
            '#decision .dec-foot button:last-child',
          );
        await p.press('Enter');
        if (sawTrigger) await finishTurn();
      },
    );
  let sawTrigger = false;
  const eleven = () =>
    p.step(
      '11',
      'A hit reveals a [Trigger]',
      'Take a hit that reveals a [Trigger]',
      'The Trigger prompt with two buttons; the result is announced',
      async () => {
        for (let i = 0; i < 20 && !sawTrigger; i++) {
          const k = await untilMine(p);
          if (k === 'main' || k === 'over') break;
          const f = await p.focus();
          p.note(`Decision "${k}"; focus: ${f.aria}`);
          if (k === 'trigger') {
            sawTrigger = true;
            p.note(`Trigger prompt: ${await p.decisionText()}`);
          }
          await answerPlainly(p, k);
        }
        // Hear the result of the [Trigger] before moving on.
        await p.page.waitForTimeout(1500);
        if (!sawTrigger) return 'not reached';
        if (!finished && tenFirst) await finishTurn();
      },
    );
  const tenFirst = await isTen();
  if (tenFirst) {
    await ten();
    await eleven();
  } else {
    await eleven();
    await ten();
  }
  if (!finished) await finishTurn();

  // 12 --------------------------------------------------------------------------------------
  let orderSeen = false;
  await p.step(
    '12',
    'Attack with the Leader',
    'Your turn: A on the Leader; arrows; Enter; Enter',
    'Only legal targets cycle; the confirm reads the `preview` maths; "Leader attacks…"',
    async () => {
      if ((await p.kind()) !== 'main') return 'not reached';
      await toZone(p, 'my-row');
      await arrowTo(p, isLeader, 'your Leader', '[data-zone="my-row"].bc-leader');
      await p.press('a');
      const n = await p.page.locator('[data-glyph="target"]').count();
      for (let i = 0; i < n; i++) await p.press('ArrowRight');
      await arrowTo(p, named(/^Opponent.s Leader/), "the opponent's Leader");
      await p.press('Enter');
      p.note(`Confirm panel: ${await p.decisionText()}`);
      await p.press('Enter');
      // Kaido's [When Attacking] DON!! −1: use it, so a DON!! returns and both Kaido trigger.
      for (let i = 0; i < 6; i++) {
        const k = await untilMine(p, 20);
        if (k === 'order') {
          orderSeen = true;
          return;
        }
        if (k === 'main' || k === 'over') return;
        p.note(`Decision "${k}": ${(await p.decisionText()).slice(0, 200)}`);
        if (k === 'optional') await decide(p, (f) => f.id === 'use-btn', 'Use', '#use-btn');
        else if (k === 'choose') {
          await decide(p, named(/Basil Hawkins/), 'Basil Hawkins', '#decision .opts button');
          await decide(p, (f) => f.id === 'choose-done', 'Done', '#choose-done');
        } else await answerPlainly(p, k);
      }
    },
  );

  // 14 (reached during 12) ------------------------------------------------------------------
  await p.step(
    '14',
    'Order two simultaneous triggers',
    'Resolve an `order` decision (two simultaneous triggers)',
    'Grab, move and drop are announced with positions; commit',
    async () => {
      if (!orderSeen) return 'not reached';
      p.note(
        "Reached during step 12: Kaido's DON!! −1 returned a DON!!, which triggered both Kaido (OP17-062).",
      );
      const f = await p.focus();
      p.note(`Focus when the order decision arrived: ${f.aria}`);
      p.note(`Panel: ${await p.decisionText()}`);
      await answerPlainly(p, 'order');
      // Let the battle finish.
      for (let i = 0; i < 10; i++) {
        const k = await untilMine(p, 20);
        if (k === 'main' || k === 'over') break;
        p.note(`Then "${k}": ${(await p.decisionText()).slice(0, 200)}`);
        await answerPlainly(p, k);
      }
    },
  );

  // 13 --------------------------------------------------------------------------------------
  await p.step(
    '13',
    'Two-target effect (Pick mode)',
    'Resolve the two-target effect (Pick mode)',
    'Count line "1 selected of up to 2"; an unavailable candidate gives its reason; commit',
    async () => {
      if ((await p.kind()) !== 'main') return 'not reached';
      p.note(
        "Queen (OP17-065) [On Play] DON!! −1: up to 2 of the opponent's Characters with a cost of 5 or less.",
      );
      await toZone(p, 'hand');
      await arrowTo(p, named(/Queen/), 'Queen');
      await p.press('Enter');
      const f = await p.focus();
      if (!/Play/.test(f.name))
        await p.assist('the Play item was not focused', '[role="menuitem"]');
      await p.press('Enter');
      let picked = 0;
      for (let i = 0; i < 10; i++) {
        const k = await untilMine(p, 20);
        if (k === 'main' || k === 'over') break;
        const text = await p.decisionText();
        p.note(`Decision "${k}": ${text.slice(0, 300)}`);
        if (k === 'optional') {
          await decide(p, (f) => f.id === 'use-btn', 'Use', '#use-btn');
        } else if (k === 'choose' && /up to 2/.test(text)) {
          // Hear every candidate, including the one that cannot be chosen.
          await toDecision(p);
          for (let j = 0; j < 8; j++) {
            const g = await p.press('Tab');
            if (g.id === 'choose-done' || !g.inDecision) break;
          }
          for (const re of [/Yamato/, /Basil Hawkins|Nola/]) {
            await decide(
              p,
              named(re),
              String(re),
              '#decision .opts button:not([aria-disabled="true"])',
            );
            picked++;
            p.note(
              `Status after pick ${picked}: ${await p.page
                .locator('#decision [role="status"]')
                .first()
                .innerText({ timeout: 1000 })
                .catch(() => '?')}`,
            );
          }
          await decide(p, (f) => f.id === 'choose-done', 'Done', '#choose-done');
        } else await answerPlainly(p, k);
      }
      if (!picked) return 'not reached';
    },
  );

  // 15 --------------------------------------------------------------------------------------
  await p.step(
    '15',
    'Rewind',
    'U, then R, then choose a move and confirm',
    'The rewind sentence; the list reads each move; focus is restored per §4.3',
    async () => {
      await toZone(p, 'hand');
      await p.press('U');
      p.note(`After U: decision "${await p.kind()}"; focus: ${(await p.focus()).aria}`);
      await toZone(p, 'hand');
      const g = await p.press('r');
      if (!g.inDialog) {
        p.note(`R did not open the rewind list; focus: ${g.aria}`);
        return;
      }
      // The list: arrows first (as the spec says), then Tab if arrows do not move focus.
      let h = g;
      for (let i = 0; i < 2; i++) h = await p.press('ArrowDown');
      if (h.aria === g.aria) p.note('ArrowDown did not move focus in the rewind list.');
      // Choose the newest move (the first item), then confirm.
      await p.until('Shift+Tab', (x) => x.aria === g.aria, 8);
      h = await p.press('Enter');
      if (h.inDialog && !/^Rewind to before it/.test(h.name))
        h = (await p.until('Tab', named(/^Rewind to before it/), 30)) ?? h;
      if (/^Rewind to before it/.test(h.name) && !h.aria.includes('[disabled]'))
        h = await p.press('Enter');
      if (h.inDialog) {
        p.note(`The rewind did not happen; focus: ${h.aria}. Closing the list with Escape.`);
        h = await p.press('Escape');
      }
      p.note(`After the rewind: decision "${await p.kind()}"; focus: ${h.aria}`);
    },
  );

  // 16 --------------------------------------------------------------------------------------
  await p.step(
    '16',
    'Shortcut sheet',
    '?, then Escape',
    'Sheet dialog read; focus returns',
    async () => {
      if ((await p.focus()).inDialog) await p.press('Escape');
      await toZone(p, 'hand');
      await p.press('?');
      await p.press('Escape');
    },
  );

  // 17 --------------------------------------------------------------------------------------
  await p.step(
    '17',
    'Single-key shortcuts off',
    'Settings → Single-key shortcuts off; back to the board; press A',
    'Nothing happens; the action menu still offers Attack',
    async () => {
      const toggle = p.page.getByRole('checkbox', { name: /single-key shortcuts/i });
      const sw = p.page.getByRole('switch', { name: /single-key shortcuts/i });
      if ((await toggle.count()) + (await sw.count()) === 0) {
        p.note('There is no Settings screen and no "Single-key shortcuts" setting in this build.');
        return 'not built';
      }
    },
  );

  // 18 --------------------------------------------------------------------------------------
  await p.step(
    '18',
    'Play to the end',
    'Play to the end (Rookie)',
    '`GameEnded` is announced assertively; review link reachable',
    async () => {
      for (let i = 0; i < 60 && !(await gameOver(p)); i++) {
        const k = await untilMine(p);
        if (k === 'over' || (await gameOver(p))) break;
        if (k !== 'main') {
          await answerPlainly(p, k);
          continue;
        }
        const attacker = p.page.locator(
          '[data-zone="my-row"][data-glyph="attack"], [data-zone="my-chars"][data-glyph="attack"]',
        );
        if (await attacker.count()) {
          await p.assist('step 18 drives the game: focus an attacker', async () => {
            await attacker.first().focus();
          });
          await p.press('a');
          const ok = await p.until('ArrowRight', named(/^Opponent.s Leader/), 8);
          if (!ok) {
            await p.press('Escape');
            await p.press('e');
            continue;
          }
          await p.press('Enter');
          await p.press('Enter');
          continue;
        }
        await toZone(p, 'hand');
        await p.press('e');
      }
      if (!(await gameOver(p))) return 'not reached';
      p.note(`Final panel: ${await p.decisionText()}`);
      const f = await p.until('Tab', (x) => /review/i.test(x.name) || x.name === 'Game log', 12);
      p.note(
        f && /review/i.test(f.name)
          ? `Review reached by Tab: ${f.aria}`
          : 'No control named "review" between the game-over heading and the game log.',
      );
    },
  );
}
