/**
 * M11 Track C drills: the two Leaders the owner practises, OP18-021 Franky and EB02-010 Monkey.D.Luffy,
 * each get their own deterministic pass in every generator, so every bank holds at least
 * `FOCUS_MIN` items with the Leader in the player's seat, and items for the lines that are the
 * point of the cards: Luffy's DON!! −2 (two DON!! set active when the only Characters are Straw Hat
 * Crew), Franky's Stage that counts as a +3000 Counter, and Franky's DON!! −1 "play a Stage".
 *
 * Nothing here relaxes an any-hand rule: the items are admitted by the same classification as the
 * base walk and re-verified by the same tests (drills-*.test.ts run over every committed item).
 */
import { project, queries, reduce } from '@optcg/engine';
import { describe, expect, it, vi } from 'vitest';
import { donLedger } from '../src/coach/tempo.ts';
import {
  bankFor,
  type CounterItem,
  type DonItem,
  type LethalItem,
  type MulliganItem,
} from '../src/search/drills/index.ts';
import {
  FOCUS_LEADERS,
  FOCUS_MIN,
  INERT_LIFE,
  type ListSet,
} from '../src/search/drills/positions.ts';
import {
  isFocusItem,
  judgeCounter,
  leaderAttacks,
  replayCounter,
  reverifyCounter,
  survivingCounters,
  toCounterStep,
} from '../src/search/drills/counter.ts';
import {
  explainDon,
  judgeDonLine,
  offersLeader,
  replayLine,
  reverifyDon,
  usesLeader,
} from '../src/search/drills/don.ts';
import { candidateLines, describeLine, LEADER_KINDS } from '../src/search/drills/lines.ts';
import { playbookFor } from '../src/playbook.ts';
import { mulliganVerdict } from '../src/search/mulligan.ts';
import { explainMulligan } from '../src/search/review/mulligan.ts';
import { judgeMulligan, metaListSets, mulliganBank } from '../src/search/drills/mulligan.ts';
import { classify } from '../src/search/drills/lethal.ts';
import { startOf } from '../src/search/drills/play.ts';
import { lifeOf } from './support/scenario.ts';
import { cardMap } from './support.ts';

vi.setConfig({ testTimeout: 600_000 });

const cards = cardMap();
const sets: ListSet[] = metaListSets();
const FRANKY = 'OP18-021';
const LUFFY = 'EB02-010';
const banks = {
  mulligan: bankFor('mulligan').items as MulliganItem[],
  counter: bankFor('counter').items as CounterItem[],
  don: bankFor('don').items as DonItem[],
  lethal: bankFor('lethal').items as LethalItem[],
};
const mineOf = <T extends { mine: string }>(xs: T[], leader: string): T[] =>
  xs.filter((i) => i.mine === leader);

describe('every bank holds the focus Leaders in the player seat', () => {
  it('names the two Leaders and the minimum', () => {
    expect([...FOCUS_LEADERS]).toEqual([FRANKY, LUFFY]);
    expect(FOCUS_MIN).toBe(6);
  });

  for (const drill of ['mulligan', 'counter', 'don', 'lethal'] as const)
    for (const leader of [FRANKY, LUFFY])
      it(`${drill}: at least ${FOCUS_MIN} items with ${leader} as the player's Leader`, () => {
        const n = mineOf(banks[drill] as { mine: string }[], leader).length;
        expect(n, `${drill} ${leader}: ${n} items`).toBeGreaterThanOrEqual(FOCUS_MIN);
      });

  it('item ids are unique across each bank (the focus passes use seeds of their own)', () => {
    for (const items of Object.values(banks))
      expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });
});

describe('mulligan: both classes, both seats, for each focus Leader', () => {
  const ids = (leader: string) => mineOf(banks.mulligan, leader);
  for (const leader of FOCUS_LEADERS)
    it(`${leader}: keep and redraw, going first and second, labelled as our reasoning`, () => {
      const mine = ids(leader);
      for (const first of [true, false])
        for (const cls of ['keep', 'redraw'])
          expect(
            mine.filter((i) => i.first === first && i.id.endsWith(`-${cls}`)).length,
            `${leader} ${first ? '1st' : '2nd'} ${cls}`,
          ).toBeGreaterThanOrEqual(1);
      for (const i of mine) {
        const keep = i.id.endsWith('-keep');
        expect(judgeMulligan(i, !keep, cards, sets), i.id).toBe(true);
        expect(judgeMulligan(i, keep, cards, sets), i.id).toBe(false);
      }
      // The hands are distinct (a second hand of a class is a new hand, not a repeat).
      const keys = mine.map((i) => `${i.first}|${[...i.hand].sort().join()}`);
      expect(new Set(keys).size).toBe(keys.length);
    });

  it("M11C-R2: Franky's Stages are defence in the hand (the Leader gives them +3000), in the verdict and the text", () => {
    const pb = playbookFor(FRANKY, undefined, cards);
    const ids = ['OP18-075', 'OP18-076', 'OP18-061', 'OP18-034', 'OP18-034'];
    const hand = ids.map((id) => cards.get(id)!);
    const withLeader = mulliganVerdict(hand, pb.mulligan, false, FRANKY);
    const without = mulliganVerdict(hand, pb.mulligan, false);
    expect(withLeader.met.counters).toBe(true);
    expect(without.met.counters).toBe(false);
    const text = JSON.stringify(
      explainMulligan({ hand, ownDeck: [], pb, first: false, cards }).evidence,
    );
    expect(text).not.toMatch(/no card that defends/);
    expect(text).toMatch(/defends with/);
    // The committed items: every Franky verdict is the one with the Leader.
    for (const i of mineOf(banks.mulligan, FRANKY)) {
      const h = i.hand.map((id) => cards.get(id)!);
      const p = playbookFor(FRANKY, i.deck, cards);
      expect(mulliganVerdict(h, p.mulligan, i.first, FRANKY).keep, i.id).toBe(
        i.id.endsWith('-keep'),
      );
    }
  });

  it('is deterministic: the extras come after every base item, so no base id moved', () => {
    const again = mulliganBank(sets, cards);
    expect(again).toEqual(banks.mulligan);
    const firstExtra = banks.mulligan.findIndex((i) => /-(1st|2nd)-\d+-(keep|redraw)$/.test(i.id));
    expect(firstExtra).toBeGreaterThan(0);
    for (const i of banks.mulligan.slice(firstExtra))
      expect(i.id).toMatch(/-(1st|2nd)-\d+-(keep|redraw)$/);
  });
});

describe('counter: Franky counts a Stage in hand as +3000', () => {
  const franky = mineOf(banks.counter, FRANKY);
  const luffy = mineOf(banks.counter, LUFFY);
  const isStage = (id: string) => cards.get(id)?.category === 'Stage';

  it('the focus items are in the bank, the classes are mixed, and each is judged both ways', () => {
    for (const items of [franky, luffy]) {
      expect(items.filter((i) => i.expect === 'counter').length).toBeGreaterThanOrEqual(3);
      expect(items.filter((i) => i.expect === 'take').length).toBeGreaterThanOrEqual(2);
      for (const i of items) {
        expect(judgeCounter(i, i.expect), i.id).toBe(true);
        expect(judgeCounter(i, i.expect === 'counter' ? 'take' : 'counter'), i.id).toBe(false);
      }
    }
    expect(banks.counter.filter(isFocusItem).length).toBeGreaterThanOrEqual(12);
  });

  // Three or more should-counter items where the Stage is what saves the turn.
  const stageSaves = franky.filter(
    (i) => i.expect === 'counter' && (i.scenario.p1.hand ?? []).some(isStage),
  );

  it('at least three should-counter items hold a Stage as the counter (it is a Counter only through the Leader)', () => {
    expect(stageSaves.length).toBeGreaterThanOrEqual(3);
    for (const i of stageSaves) {
      for (const id of (i.scenario.p1.hand ?? []).filter(isStage))
        // A Stage has no Counter of its own: it is the Leader's +3000 that makes it one.
        expect(cards.get(id)?.counter ?? 0, id).toBe(0);
      const { counter } = replayCounter(i, cards);
      expect(survivingCounters(counter, cards), i.id).not.toBeNull();
    }
  });

  it('(revert check) without its Stage the same position has no counter that survives: the Stage is the answer', () => {
    for (const i of stageSaves) {
      const sc = i.scenario;
      const hand = (sc.p1.hand ?? []).filter((id) => !isStage(id));
      const without = { ...sc, p1: { ...sc.p1, hand } };
      const m0 = startOf(without, cards);
      // The same attack, found by its attacker's card (instance ids move with the hand).
      const first = replayCounter(i, cards).counter;
      const want = queries.card(first, queries.battle(first)!.attacker).card;
      const atk = leaderAttacks(m0).find(
        (a) => a.type === 'attack' && queries.card(m0, a.attacker).card === want,
      )!;
      const step = toCounterStep(m0, atk)!;
      expect(survivingCounters(step.state, cards), i.id).toBeNull();
    }
  });

  it('the items re-classify to the class they store (the detectors read nothing hidden)', () => {
    for (const i of [...franky, ...luffy].filter(isFocusItem).slice(0, 8))
      expect(reverifyCounter(i, cards), i.id).toEqual({
        expect: i.expect,
        judge: i.judge,
        detector: i.detector,
      });
  });

  it('any-hand: permuting their deck order and face-down Life leaves a focus item in its class', () => {
    const sample = [...franky, ...luffy].filter(isFocusItem).filter((_, n) => n % 3 === 0);
    expect(sample.length).toBeGreaterThanOrEqual(4);
    for (const i of sample) {
      const sc = i.scenario;
      const list = sc.p2.decklist ?? [];
      const rotated = [...list.slice(11), ...list.slice(0, 11)].reverse();
      const v: CounterItem = {
        ...i,
        scenario: {
          ...sc,
          p2: {
            ...sc.p2,
            decklist: rotated,
            life: (sc.p2.life ?? []).map((_, n) => rotated[n]!) as never,
          },
        },
      };
      expect(reverifyCounter(v, cards), i.id).toEqual({
        expect: i.expect,
        judge: i.judge,
        detector: i.detector,
      });
    }
  });
});

describe("don: the focus Leaders' own abilities as lines", () => {
  const franky = mineOf(banks.don, FRANKY).filter((i) => offersLeader(i));
  const luffy = mineOf(banks.don, LUFFY).filter((i) => offersLeader(i));
  const leaderLine = (i: DonItem) =>
    i.lines.find((l) => (LEADER_KINDS as string[]).includes(l.id))!;

  it('each Leader has at least four items where its ability is the saving line and two where it is the wrong one', () => {
    for (const [name, items] of [
      [FRANKY, franky],
      [LUFFY, luffy],
    ] as const) {
      expect(items.filter(usesLeader).length, name).toBeGreaterThanOrEqual(4);
      expect(items.filter((i) => !usesLeader(i)).length, name).toBeGreaterThanOrEqual(2);
    }
  });

  it('judges the Leader line right where it is best and wrong where it is not, and the plain line the other way', () => {
    for (const i of [...franky, ...luffy]) {
      const l = leaderLine(i);
      expect(judgeDonLine(i, l.id), `${i.id} ${l.id}`).toBe(usesLeader(i));
      if (usesLeader(i)) {
        // The plain "play what you can" line is the wrong answer here: it leaves DON!! unused.
        const plain = i.lines.find((x) => x.id === 'spend')!;
        expect(judgeDonLine(i, plain.id), i.id).toBe(false);
        expect(plain.unused, i.id).toBeGreaterThan(l.unused);
      }
    }
  });

  it("Luffy's line really resolves: two DON!! go back to the deck, the Leader has +1000, and the DON!! are spent again", () => {
    for (const i of luffy) {
      const line = leaderLine(i);
      const { start, end } = replayLine(i, line.id, cards);
      const lid = queries.zone(end, 'p1', 'leader')[0]!.instance;
      // The ability's +1000 (until the end of their next turn) is on the Leader after the turn ends.
      expect(queries.card(end, lid).power, `${i.id} ${line.label}`).toBe(
        (cards.get(LUFFY)!.power ?? 0) + 1000,
      );
      expect(queries.don(end, 'p1').deck, i.id).toBeGreaterThanOrEqual(
        queries.don(start, 'p1').deck + 2,
      );
      expect(line.label).toMatch(/use your Leader's effect \(DON!! −2: set 2 DON!! active\)/);
      // Every Character on the board when it was used is Straw Hat Crew (the card's condition).
      for (const c of queries.zone(end, 'p1', 'characters'))
        expect(cards.get(c.card)?.types, c.card).toContain('Straw Hat Crew');
    }
  });

  it("Franky's line really resolves: one DON!! goes back, a Stage of cost 5 or less is played from hand for free", () => {
    for (const i of franky) {
      const line = leaderLine(i);
      const { start, end } = replayLine(i, line.id, cards);
      const stage = queries.zone(end, 'p1', 'stage')[0];
      expect(stage, `${i.id} ${line.label}`).toBeDefined();
      expect(cards.get(stage!.card)?.category).toBe('Stage');
      expect(cards.get(stage!.card)?.cost ?? 99).toBeLessThanOrEqual(5);
      expect(queries.zone(start, 'p1', 'stage').map((c) => c.card)).not.toContain(stage!.card);
      expect(line.label).toMatch(/use your Leader's effect \(DON!! −1: play a Stage\)/);
    }
  });

  it('the ledger agrees with every stored score, and the answer text names the Leader ability for a Leader line', () => {
    for (const i of [...franky, ...luffy]) {
      const r = reverifyDon(i, cards);
      expect(r.best, i.id).toEqual(i.best);
      for (const l of i.lines) expect(r.unused[l.id], `${i.id} ${l.id}`).toBe(l.unused);
      const l = leaderLine(i);
      const text = JSON.stringify(explainDon(i, cards, l.id).evidence);
      expect(text, i.id).toMatch(i.mine === FRANKY ? /DON!! −1 returns one DON!!/ : /DON!! −2/);
      // A line that is not a Leader line gets no Leader sentence.
      const plain = i.lines.find((x) => !(LEADER_KINDS as string[]).includes(x.id))!;
      expect(JSON.stringify(explainDon(i, cards, plain.id).evidence), i.id).not.toMatch(
        /Your Leader's DON!!/,
      );
    }
  });

  it('any-hand: giving the opponent a hand, another deck order and other Life leaves every line and score the same', () => {
    for (const i of [...franky, ...luffy]) {
      const sc = i.scenario;
      const deck = (sc.p2.decklist ?? []).slice().reverse();
      const hidden = {
        ...sc,
        p2: { ...sc.p2, hand: deck.slice(0, 3), life: lifeOf(3, INERT_LIFE), decklist: deck },
      };
      const lines = candidateLines(startOf(hidden, cards), 'p1', cards, [], true);
      expect(
        lines.map((l) => [l.id, l.unused, l.label]),
        i.id,
      ).toEqual(i.lines.map((l) => [l.id, l.unused, l.label]));
      for (const l of lines) {
        const end = replayLine({ ...i, scenario: hidden }, l.id, cards).end;
        expect(donLedger(project(end, 'p1'), cards).unused, `${i.id} ${l.id}`).toBe(l.unused);
      }
    }
  });

  it('describeLine words the Leader activation and the rest as before', () => {
    const i = franky.find(usesLeader)!;
    const line = leaderLine(i);
    const start = startOf(i.scenario, cards);
    expect(describeLine(start, line.actions, 'p1', cards)).toBe(line.label);
    expect(reduce).toBeDefined();
  });
});

describe('lethal: the focus Leaders attack', () => {
  for (const leader of FOCUS_LEADERS)
    it(`${leader}: both a lethal and a none class, each re-checked by the solver in public mode`, () => {
      const items = mineOf(banks.lethal, leader);
      expect(items.filter((i) => i.answer.lethal).length, leader).toBeGreaterThanOrEqual(3);
      expect(items.filter((i) => !i.answer.lethal).length, leader).toBeGreaterThanOrEqual(3);
      for (const i of items) {
        const { result } = classify(i.scenario, cards);
        if (i.answer.lethal) {
          expect(result.status, i.id).toBe('proven');
          expect(result.certainty, i.id).toBe('any-hand');
        } else {
          expect(result.status, i.id).toBe('refuted');
          expect(result.defence?.reason, i.id).toBe('attackers');
        }
      }
    });
});
