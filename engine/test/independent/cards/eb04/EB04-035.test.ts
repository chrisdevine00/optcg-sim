/**
 * EB04-035 Hitokiri Kamazo (Character, Purple, cost 3, 4000, Counter +1000, {Kid Pirates}/{Supernovas}/{SMILE}).
 *
 * Card text: "[Blocker]
 * [Your Turn] [Once Per Turn] When a DON!! card on your field is returned to your DON!! deck, if
 * your Leader has the {Kid Pirates} type, add up to 1 DON!! card from your DON!! deck and rest it."
 *
 * Rules: DON!! −N is a cost that returns DON!! from the field to the DON!! deck. "[Your Turn]" is
 * only active on its controller's turn. "Once per turn": one use per turn however many DON!! are
 * returned. "Add up to N DON!!" asks a count (most first); the added DON!! is rested.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  blockers,
  chars,
  decision,
  donCost,
  donDeckN,
  donTotal,
  fill,
  kind,
  LB,
  mine,
  need,
  no,
  passBlock,
  payDonAny,
  playRaw,
  theirs,
  yes,
  atMain,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-035';
/** OP15-061 Ohm: Purple, cost 1, 2000, {Sky Island}/{Vassals}. [On Play] DON!! −1: Draw 1 card. */
const CAPOTE = 'OP15-061';
const FILL = 'OP02-077'; // Purple, cost 3, 5000, vanilla
const HAJ = 'OP01-018'; // Red, cost 4, 6000

/** Answer the "how many DON!! to add" count with `n` (a `mode` choose with named options). */
function count(g: TestGame, n: number): void {
  const d = decision(g);
  if (d?.kind !== 'choose' || !d.options)
    throw new Error(`Expected a count choose, got ${d?.kind}`);
  const o = d.options.find((x) => x.id === String(n));
  if (!o) throw new Error(`No count ${n}; offered ${d.options.map((x) => x.id)}`);
  act(g, { type: 'pick', choice: { option: o.id } });
}

/** p1's turn: Kamazo on the field, `hand` Capote(s) ready, 10 active DON!!. */
function turn(leader: string, copies = 1, cards = [ID]): TestGame {
  return mine(
    leader,
    {
      characters: cards,
      hand: fill(CAPOTE, copies),
      costArea: { active: 10, rested: 0 },
      deck: fill(FILL, 10),
    },
    {},
  );
}

/** Play Capote and pay its DON!! −1 (draws 1 card). */
function capote(g: TestGame): void {
  playRaw(g, CAPOTE);
  yes(g);
  payDonAny(g, 1);
}

describe('EB04-035 Hitokiri Kamazo: [Your Turn][Once Per Turn] when a DON!! is returned, Kid Pirates Leader: add up to 1 DON!! rested', () => {
  it('after a DON!! is returned the player may add 1 DON!! from the DON!! deck, rested', () => {
    const g = turn(LB.kid);
    const [, restedBefore] = donCost(g);
    const total = donTotal(g);
    capote(g);
    // Ohm cost 1 rested 1 DON!!; DON!! −1 returned 1; the add puts one back, rested.
    need(g, 'choose', 'p1');
    count(g, 1);
    expect(atMain(g)).toBe(true);
    expect(donTotal(g)).toBe(total - 1 + 1);
    expect(donCost(g)[1]).toBe(restedBefore + 1 + 1);
    expect(donDeckN(g)).toBe(0);
  });

  it('"up to 1": may add none', () => {
    const g = turn(LB.kid);
    const total = donTotal(g);
    capote(g);
    need(g, 'choose', 'p1');
    count(g, 0);
    expect(donTotal(g)).toBe(total - 1);
    expect(donDeckN(g)).toBe(1);
  });

  it('without a {Kid Pirates} Leader nothing is added', () => {
    const g = turn(LB.foxy);
    const total = donTotal(g);
    playRaw(g, CAPOTE);
    yes(g);
    payDonAny(g, 1);
    expect(kind(g)).toBe('main');
    expect(atMain(g)).toBe(true);
    expect(donTotal(g)).toBe(total - 1);
  });

  it('[Once Per Turn]: a second DON!! return in the same turn adds nothing more', () => {
    const g = turn(LB.kid, 2);
    capote(g);
    need(g, 'choose', 'p1');
    count(g, 1);
    const total = donTotal(g);
    capote(g);
    expect(atMain(g)).toBe(true);
    expect(donTotal(g)).toBe(total - 1);
  });

  it('declining the DON!! −1 cost returns nothing and adds nothing', () => {
    const g = turn(LB.kid);
    const total = donTotal(g);
    playRaw(g, CAPOTE);
    no(g);
    expect(atMain(g)).toBe(true);
    expect(donTotal(g)).toBe(total);
  });

  it('a Character without Kamazo on the field gets no add (control)', () => {
    const g = turn(LB.kid, 1, []);
    const total = donTotal(g);
    capote(g);
    expect(atMain(g)).toBe(true);
    expect(donTotal(g)).toBe(total - 1);
  });

  it('[Your Turn]: a DON!! returned on the opponent turn adds nothing', () => {
    // p1 defends with the Counter [OP07-076 Slow-Slow Beam Sword] (DON!! −1) while Kamazo is on the field.
    const g = theirs(
      LB.kid,
      {
        characters: [ID],
        hand: ['OP07-076'],
        costArea: { active: 3, rested: 0 },
        life: fill(FILL, 4),
        deck: fill(FILL, 10),
      },
      { characters: [HAJ] },
    );
    const total = donTotal(g);
    attack(g, at(g, 'p2', 'characters', HAJ), g.leader('p1'));
    passBlock(g);
    const ev = g.find('p1', 'hand', 'OP07-076');
    const a = g
      .legal()
      .find((x) => (x.type === 'activate' || x.type === 'counter') && x.card === ev);
    if (!a)
      throw new Error(
        'Counter not offered: ' + JSON.stringify(g.legal()) + JSON.stringify(decision(g)),
      );
    g.act(a);
    if (kind(g) === 'optional') yes(g);
    payDonAny(g, 1);
    // The Counter's own target pick may follow; no DON!! count may be asked.
    if (kind(g) === 'choose') {
      expect(decision(g)?.options).toBeUndefined();
      act(g, { type: 'pick', choice: g.leader('p1') });
    }
    // Then "rest up to 1 of your opponent's Characters": take none.
    if (kind(g) === 'choose') act(g, { type: 'done' });
    expect(kind(g)).toBe('counter');
    expect(donTotal(g)).toBe(total - 1);
  });

  it('[Blocker]: Kamazo can block an attack on the Leader', () => {
    const g = theirs(
      LB.kid,
      { characters: [ID], life: fill(FILL, 4), deck: fill(FILL, 10) },
      { characters: [HAJ] },
    );
    attack(g, at(g, 'p2', 'characters', HAJ), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
  });

  it('the Character stays on the field after its effect (nothing is trashed)', () => {
    const g = turn(LB.kid);
    capote(g);
    need(g, 'choose', 'p1');
    count(g, 1);
    expect(chars(g)).toEqual([CAPOTE, ID].sort());
  });
});
