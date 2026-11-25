/**
 * M7 WP3: the opponent's-turn threat check (`search/lethal/threat.ts`). Planted positions, worked by
 * hand from the rules; the player is p1 and the opponent p2 owes the Main Phase decision.
 *
 * - A hit on a Leader with 0 Life wins (CR 7-1-4-1-1-1); each hit with Life left moves one Life card to
 *   the hand (7-1-4-1-1-2). So with L Life the opponent needs L + 1 hits, one per attacker.
 * - The attacker wins a battle at equal power or more (7-1-4-1). All Leaders are 5000, and the
 *   opponent's Leader and Characters (5000, 7000, 9000) all beat or tie it.
 * - Their Leader can attack too, so with a Leader and two Characters they have 3 attackers; "you must
 *   stop N of their A attacks" is A − (L + 1) + 1.
 * - A Blocker stops one attack and is then rested (7-1-2-1); a Counter adds its value to the card it
 *   defends for the battle (7-1-3-1): Wyper's +2000 turns a tie of 5000 against 5000 into a stop.
 */
import { describe, expect, it, vi } from 'vitest';
import { legalActions, projectForSearch, queries, reduce, type GameState } from '@optcg/engine';
import { lethal } from '../src/index.ts';
import { threat, answerThreat, triggerChance } from '../src/search/lethal/threat.ts';
import { certaintyLabel } from '../src/explanation.ts';
import { search } from '../src/search/lethal/search.ts';
import { cardMap } from './support.ts';
import { asVanilla } from './support/vanilla.ts';
import { lifeOf, listOf, start, type Spec } from './support/scenario.ts';

vi.setConfig({ testTimeout: 120_000 });

asVanilla('OP13-001', 'OP13-027', 'OP13-118');

const ROCKS = 'OP17-039';
const LUFFY = 'OP13-001'; // 5000 Leader, unscripted
const SANJI = 'OP13-027'; // 7000
const ZORO = 'EB04-007'; // 9000
const KAIDO_BLOCKER = 'OP17-042'; // 6000 [Blocker]
const WYPER = 'OP12-114'; // 7000, Counter +2000
const KID = 'EB01-003'; // 5000 [Rush], cost 4
const NO_COUNTER = ZORO;

const cards = cardMap();
const CAP = { nodes: 250_000 };

/** Player 2 (the opponent) is in their Main Phase; p1 (you) defends. */
function position(o: {
  /** Your Life, hand and Characters. */
  life: number;
  hand?: string[];
  blockers?: string[];
  /** Their Characters, their active DON!!, their hand (never counted). */
  chars?: string[];
  don?: number;
  theirHand?: string[];
  theirLife?: string[];
  theirDeck?: string[];
  myDeck?: string[];
  myLife?: string[];
  lifeCard?: string;
}): GameState {
  const spec: Spec = {
    seed: 7,
    turn: 10,
    activePlayer: 'p2',
    firstPlayer: 'p1',
    p1: {
      leader: LUFFY,
      characters: o.blockers ?? [],
      life: o.myLife ?? lifeOf(o.life, o.lifeCard ?? NO_COUNTER),
      hand: o.hand ?? [],
      costArea: { active: 0, rested: 0 },
      decklist: o.myDeck ?? listOf(ROCKS),
    },
    p2: {
      leader: ROCKS,
      characters: o.chars ?? [],
      life: o.theirLife ?? lifeOf(4, NO_COUNTER),
      hand: o.theirHand ?? [],
      costArea: { active: o.don ?? 0, rested: 0 },
      decklist: o.theirDeck ?? listOf(ROCKS),
    },
  };
  return start(spec);
}

const check = (s: GameState, opts: Parameters<typeof threat>[3] = {}, nodes = CAP.nodes) =>
  threat(projectForSearch(s, 'p1'), cards, { nodes }, opts);

describe('the engine keeps their Main searchable', () => {
  it('the view shows an opponent Main decision and the skeleton is not opaque', () => {
    const view = projectForSearch(position({ life: 1, chars: [SANJI] }), 'p1');
    expect(view.decision).toMatchObject({ kind: 'main', player: 'p2' });
    expect(view.skeleton.opaque).toBe(false);
  });
});

describe('proven: their board threatens lethal', () => {
  /**
   * You: 1 Life, nothing in hand, no Blocker. They: Leader 5000, Sanji 7000, Zoro 9000, three
   * attackers, two hits needed (1 Life + 1): you must stop 3 − 2 + 1 = 2 of the 3. You hold nothing.
   */
  it('says how many attacks you must stop, and that nothing you hold stops them', () => {
    const r = check(position({ life: 1, chars: [SANJI, ZORO] }));
    expect(r.status).toBe('proven');
    expect(r.mustStop).toEqual({ stop: 2, of: 3 });
    expect(r.holds).toBe(false);
    expect(r.explanation.claim).toBe(
      'Their board threatens lethal: you must stop 2 of their 3 attacks.',
    );
    expect(r.explanation.outcome).toMatch(/^You lose this turn: nothing you hold/);
    expect(r.explanation.evidence.map((e) => e.text)).toContain(
      'This does not count the cards in their hand.',
    );
    expect(r.line!.filter((m) => m.kind === 'attack').length).toBeGreaterThanOrEqual(2);
  });

  /**
   * You: 2 Life (three hits needed), they have 3 attackers: you must stop 1 of 3. Without a Blocker
   * you cannot; with an active Blocker (Kaido 6000) you stop one attack, so it holds.
   */
  it('needs a Blocker: the same board is lethal without one and held with one', () => {
    const without = check(position({ life: 2, chars: [SANJI, ZORO] }));
    expect(without.status).toBe('proven');
    expect(without.mustStop).toEqual({ stop: 1, of: 3 });
    expect(without.holds).toBe(false);
    const withBlocker = check(
      position({ life: 2, chars: [SANJI, ZORO], blockers: [KAIDO_BLOCKER] }),
    );
    expect(withBlocker.status).toBe('proven');
    expect(withBlocker.holds).toBe(true);
    expect(withBlocker.explanation.outcome).toBe(
      'You lose this turn unless you stop 1 of their 3 attacks; your hand and Blockers can.',
    );
    expect(withBlocker.explanation.evidence.map((e) => e.text)).toContain(
      'Your defence: 1 active Blocker (Kaido).',
    );
  });

  /** A Counter in your real hand is your defence: Wyper's +2000 stops a 5000 Leader attack on your 5000. */
  it('counts the Counters in your real hand as your defence', () => {
    const r = check(position({ life: 2, chars: [SANJI, ZORO], hand: [WYPER] }));
    expect(r.status).toBe('proven');
    expect(r.holds).toBe(true);
    expect(r.explanation.evidence.map((e) => e.text)).toContain(
      'Your defence: 2000 of Counters in your hand.',
    );
  });

  it('a threat is not proven for a board that cannot land enough hits (3 Life: four hits, three attackers)', () => {
    const r = check(position({ life: 3, chars: [SANJI, ZORO] }));
    expect(r.status).toBe('refuted');
    expect(r.explanation.claim).toBe('Their board does not threaten lethal this turn.');
    expect(r.certainty).toBe('needed-hidden-info');
    expect(r.explanation.outcome).toMatch(/unless their hand adds to it/);
  });
});

describe('their hand is not counted, and the copy says so', () => {
  /**
   * They hold Kid & Killer [Rush] (cost 4) with 4 active DON!!: played, it is a third attacker. With
   * 2 Life they need 3 hits and have 2 attackers, so without the hand the board is no threat. The
   * check ignores their hand: refuted. Against the real hand (actual mode) it is lethal, so the
   * answer differs from one that read their hand: the check has not looked.
   */
  it('refutes from the board alone where their real hand would make lethal', () => {
    const s = position({ life: 2, chars: [SANJI], don: 4, theirHand: [KID] });
    expect(check(s).status).toBe('refuted');
    expect(lethal({ mode: 'actual', state: s, attacker: 'p2' }, cards, CAP).status).toBe('proven');
  });
});

describe('hidden information', () => {
  /**
   * Two positions that differ only in cards hidden from you: their hand, Life and deck, and your own
   * Life and deck. Identical results, byte for byte, and the same with your list given.
   */
  const a = position({ life: 2, chars: [SANJI, ZORO], don: 4, theirHand: [KID, SANJI, ZORO] });
  const b = position({
    life: 2,
    chars: [SANJI, ZORO],
    don: 4,
    theirHand: [WYPER, WYPER, WYPER],
    theirLife: lifeOf(4, WYPER),
    theirDeck: listOf('OP17-058'),
  });
  it('gives identical results when only their hidden cards differ', () => {
    for (const opts of [{}, { ownDeck: listOf(ROCKS) }])
      expect(JSON.stringify(check(a, opts))).toBe(JSON.stringify(check(b, opts)));
  });
  it('the differential has teeth: a check that read their hand (actual mode) tells the two apart', () => {
    const x = position({ life: 2, chars: [SANJI], don: 4, theirHand: [KID] });
    const y = position({ life: 2, chars: [SANJI], don: 4, theirHand: [WYPER] });
    expect(JSON.stringify(check(x))).toBe(JSON.stringify(check(y)));
    const real = (s: GameState) =>
      lethal({ mode: 'actual', state: s, attacker: 'p2' }, cards, CAP).status;
    expect(real(x)).not.toBe(real(y));
  });
  it("the request carries only the asking seat's view and list", () => {
    const view = projectForSearch(a, 'p1');
    const res = answerThreat({ type: 'threat', id: 5, view, capMs: 0, nodes: CAP.nodes }, cards);
    expect(res).toMatchObject({ type: 'threat', id: 5, result: { status: 'proven' } });
    const text = JSON.stringify(res.result);
    for (const id of [KID, WYPER]) expect(text).not.toContain(id);
  });
});

describe('your face-down Life and [Trigger] chance', () => {
  const TRIGGER = 'OP14-104'; // has a [Trigger]
  const list = [...Array(46).fill(NO_COUNTER), ...Array(4).fill(TRIGGER)] as string[];
  it('states no chance without your list, and does not count the Life', () => {
    const r = check(position({ life: 2, chars: [SANJI, ZORO] }));
    expect(r.triggerChance).toBeNull();
    expect(r.certainty).toBe('needed-hidden-info');
    expect(r.explanation.evidence.at(-1)!.text).toMatch(
      /are not counted: a \[Trigger\] among them/,
    );
  });
  it('with your list: the chance at least one face-down Life card is a Trigger, from the unseen cards', () => {
    // Your list has 50 cards, 4 of them Triggers. Nothing of yours is in view, so the 2 Life cards and
    // the 48 in the deck are the unseen 50: P(none of 2) = (46/50) × (45/49) = 0.8449, so 15.5%.
    const s = position({
      life: 2,
      chars: [SANJI, ZORO],
      myDeck: list,
      myLife: [NO_COUNTER, NO_COUNTER],
    });
    const chance = triggerChance(projectForSearch(s, 'p1'), list, cards);
    expect(chance).toBeCloseTo(1 - (46 / 50) * (45 / 49), 12);
    const r = check(s, { ownDeck: list });
    expect(r.triggerChance).toBeCloseTo(0.155, 3);
    expect(r.certainty).toBe('needed-hidden-info');
    expect(r.explanation.evidence.at(-1)!.text).toBe(
      'A [Trigger] among your 2 face-down Life cards could change this: about 16% that at least one is.',
    );
  });
  it('a card you can see leaves the pool: a Trigger in your hand is not in your Life', () => {
    // The same list, with one Trigger copy in your hand: 49 unseen (3 Triggers), 2 Life.
    const s = position({
      life: 2,
      chars: [SANJI, ZORO],
      hand: [TRIGGER],
      myDeck: list,
      myLife: [NO_COUNTER, NO_COUNTER],
    });
    expect(triggerChance(projectForSearch(s, 'p1'), list, cards)).toBeCloseTo(
      1 - (46 / 49) * (45 / 48),
      12,
    );
  });
  it('a list that does not match what you can see gives no chance (null), not a guess', () => {
    const s = position({
      life: 2,
      chars: [SANJI, ZORO],
      myDeck: list,
      myLife: [NO_COUNTER, NO_COUNTER],
    });
    expect(triggerChance(projectForSearch(s, 'p1'), list.slice(0, 40), cards)).toBeNull();
  });
  it('a list with no Trigger gives 0 and an any-hand proof', () => {
    const none = Array(50).fill(NO_COUNTER) as string[];
    const s = position({
      life: 2,
      chars: [SANJI, ZORO],
      myDeck: none,
      myLife: [NO_COUNTER, NO_COUNTER],
    });
    expect(triggerChance(projectForSearch(s, 'p1'), none, cards)).toBe(0);
    const r = check(s, { ownDeck: none });
    expect(r.certainty).toBe('any-hand');
    expect(certaintyLabel(r.certainty, 'coach')).toBe('Works against any hand');
  });
});

describe('not their Main Phase', () => {
  it('answers unknown, with a reason, on your own Main Phase', () => {
    const own = start({
      seed: 3,
      turn: 9,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: LUFFY,
        characters: [SANJI],
        life: lifeOf(2, NO_COUNTER),
        hand: [],
        costArea: { active: 0, rested: 0 },
        decklist: listOf(ROCKS),
      },
      p2: {
        leader: ROCKS,
        characters: [],
        life: lifeOf(2, NO_COUNTER),
        hand: [],
        costArea: { active: 0, rested: 0 },
        decklist: listOf(ROCKS),
      },
    });
    const r = threat(projectForSearch(own, 'p1'), cards, CAP);
    expect(r.status).toBe('unknown');
    expect(r.explanation.evidence[0]!.text).toBe('It is not their Main Phase.');
  });
  it('an exhausted node cap is unknown, never "no threat"', () => {
    const r = check(position({ life: 2, chars: [SANJI, ZORO], don: 4 }), {}, 1);
    expect(r.status).toBe('unknown');
    expect(r.certainty).toBe('search-incomplete');
  });
});

describe('sound against actual mode with their hand empty', () => {
  /**
   * With their hand empty, `lethal` in `actual` mode searches the same attacker against your real
   * defence. It proves exactly when the board threatens and your defence fails (`holds === false`).
   * Boards are generated: your Life, Blockers and Wyper Counters; their Characters and DON!!.
   */
  it('agrees on generated positions', () => {
    let rng = 12345;
    const next = (n: number): number => {
      rng = (Math.imul(rng, 1103515245) + 12345) >>> 0;
      return (rng >>> 8) % n;
    };
    const pool = [SANJI, ZORO, 'OP14-104'];
    const tally = { proven: 0, held: 0, refuted: 0 };
    for (let i = 0; i < 60; i++) {
      const s = position({
        life: next(4),
        hand: Array.from({ length: next(3) }, () => WYPER),
        blockers: Array.from({ length: next(3) }, () => KAIDO_BLOCKER),
        chars: Array.from({ length: next(4) }, () => pool[next(pool.length)]!),
        don: next(5),
      });
      const t = check(s);
      const actual = lethal({ mode: 'actual', state: s, attacker: 'p2' }, cards, CAP);
      expect(t.status, `position ${i}`).not.toBe('unknown');
      expect(actual.status, `position ${i}`).not.toBe('unknown');
      const threatens = t.status === 'proven';
      // A board that does not threaten (even undefended) cannot beat real defence; one that does
      // wins in actual mode exactly when your defence fails.
      expect(actual.status === 'proven', `position ${i}`).toBe(threatens && t.holds === false);
      if (!threatens) tally.refuted++;
      else if (t.holds) tally.held++;
      else tally.proven++;
    }
    expect(tally.proven).toBeGreaterThan(5);
    expect(tally.held).toBeGreaterThan(3);
    expect(tally.refuted).toBeGreaterThan(5);
  });
});

describe('the line is legal', () => {
  it('their attacks, taken, win from the real position (the line names real attackers)', () => {
    const s = position({ life: 1, chars: [SANJI, ZORO] });
    const r = check(s);
    expect(r.status).toBe('proven');
    expect(r.line!.map((m) => m.text)).toEqual(
      expect.arrayContaining([expect.stringMatching(/ attacks your Leader\.$/)]),
    );
    // Replay: they attack with everything; you take each hit. They win.
    let st = s;
    for (let i = 0; i < 80 && !queries.result(st); i++) {
      const dec = queries.decision(st)!;
      const acts = legalActions(st).filter((a) => a.type !== 'concede');
      const pick =
        dec.player === 'p2'
          ? (acts.find((a) => a.type === 'attack') ?? acts[0]!)
          : (acts.find((a) => a.type === 'block' && a.blocker === null) ??
            acts.find((a) => a.type === 'endCounter') ??
            acts[0]!);
      st = reduce(st, pick).state;
    }
    expect(queries.result(st)).toMatchObject({ winner: 'p2' });
  });
});

describe('the search filter', () => {
  it('attackerHand: ignored stops the search playing from the attacker hand; without it the Rush card wins', () => {
    const s = position({ life: 2, chars: [SANJI], don: 4, theirHand: [KID] });
    expect(search(s, 'p2', CAP).status).toBe('proven');
    expect(search(s, 'p2', { ...CAP, attackerHand: 'ignored' }).status).toBe('refuted');
  });
});
