/**
 * OP18-046 Mr.0 & Ms. All Sunday (Character, Blue, cost 9, 10000, {The Seven Warlords of the
 * Sea}/{Baroque Works}).
 *
 * Card text (cards/data):
 *   "[On Play] Draw 2 cards and give your Leader and all of your Characters up to 2 rested DON!!
 *    cards each.
 *    [On Your Opponent's Attack] You may trash 1 card from your hand: The base power of your Leader
 *    with a type including "Baroque Works" becomes 7000 during this turn."
 *
 * Rules: "up to 2 ... each" lets every target take 0, 1 or 2 rested DON!! (CR 8-4-4-1); only rested
 * DON!! of the cost area can be given; Mr.0 himself is one of "all of your Characters". The second
 * ability is an optional cost-effect: declining pays nothing. Base power 7000 replaces the printed
 * 5000 for the whole turn (opponent's turn here); it does nothing to a Leader without a Baroque
 * Works type.
 *
 * Scenery: ST03-001 Crocodile (Blue Leader, {Baroque Works}); ST01-001 Luffy (no such type);
 * OP01-018 Hajrudin (6000) attacks; OP01-012 Sai / OP02-006 Kingdew are vanilla.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, attack, noDefence, passBlock, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  cardIds,
  decline,
  donOf,
  fill,
  kind,
  LDR,
  mine,
  need,
  offered,
  theirs,
  VAN,
} from './kit-d.ts';

const MR0 = 'OP18-046';
const CROC = 'ST03-001';
const TOP = 'OP01-010';

function onPlay(p1: Partial<PlayerSpec> = {}): TestGame {
  return mine(CROC, {
    hand: [MR0],
    characters: [VAN.sai, VAN.marco],
    deck: [TOP, TOP, TOP, TOP, TOP, TOP],
    costArea: { active: 9, rested: 0 },
    ...p1,
  });
}

/** Answer every pending "how many rested DON!!" question with min(n, largest option offered). Returns the questions seen. */
function giveEach(g: TestGame, n: number): { who: string; options: string[] }[] {
  const seen: { who: string; options: string[] }[] = [];
  while (kind(g) === 'choose') {
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('mode');
    const options = (d.options ?? []).map((o) => o.id);
    seen.push({ who: d.prompt, options });
    const take =
      options.filter((o) => Number(o) <= n).sort((a, b) => Number(b) - Number(a))[0] ?? options[0]!;
    act(g, { type: 'pick', choice: { option: take } });
  }
  return seen;
}

const donsOn = (g: TestGame) => [
  g.card(g.leader('p1')).don,
  ...g.zone('p1', 'characters').map((c) => c.don),
];

describe('OP18-046 Mr.0 & Ms. All Sunday: [On Play] draw 2, give the Leader and all Characters up to 2 rested DON!! each', () => {
  it('draws 2 cards and gives 2 rested DON!! to the Leader, to Mr.0 himself and to every other Character', () => {
    const g = onPlay();
    play(g, g.find('p1', 'hand', MR0));
    expect(cardIds(g, 'p1', 'hand')).toEqual([TOP, TOP]);
    const seen = giveEach(g, 2);
    expect(seen).toHaveLength(4);
    expect(donsOn(g).sort()).toEqual([2, 2, 2, 2]);
    expect(g.card(g.find('p1', 'characters', MR0)).don).toBe(2);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 1, given: 8 });
    expect(kind(g)).toBe('main');
  });

  it('only rested DON!! are given: the 9 DON!! rested to pay the cost are the pool, nothing comes from the DON!! deck', () => {
    const g = onPlay();
    play(g, g.find('p1', 'hand', MR0));
    giveEach(g, 2);
    const don = donOf(g, 'p1');
    expect(don.active).toBe(0);
    expect(don.deck).toBe(1);
    expect(don.rested + don.given).toBe(9);
  });

  it('the pool limits the total: with 6 targets and 9 rested DON!! no more than 9 are given', () => {
    const g = onPlay({ characters: fill(VAN.sai, 4) });
    play(g, g.find('p1', 'hand', MR0));
    giveEach(g, 2);
    const don = donOf(g, 'p1');
    expect(don.given).toBe(9);
    expect(don.rested).toBe(0);
    expect(Math.max(...donsOn(g))).toBeLessThanOrEqual(2);
  });

  it('"up to 2": a target may be given 1 instead of 2', () => {
    const g = onPlay();
    play(g, g.find('p1', 'hand', MR0));
    giveEach(g, 1);
    expect(donsOn(g).sort()).toEqual([1, 1, 1, 1]);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 5, given: 4 });
  });

  // Settled: OP-18 review R8 fixed in ENGINE_VERSION 0.5.19 (DISAGREEMENTS-d.md).
  it('"up to 2": a target may be given 0 (the count question offers 0, CR 8-4-4-1)', () => {
    const g = onPlay();
    play(g, g.find('p1', 'hand', MR0));
    const d = need(g, 'choose', 'p1');
    expect((d.options ?? []).map((o) => o.id)).toContain('0');
  });

  it('"your Leader and all of your Characters": with no other Character only the Leader and Mr.0 are asked; the opponent’s Characters get none', () => {
    const g = mine(
      CROC,
      { hand: [MR0], deck: fill(TOP, 6), costArea: { active: 9, rested: 0 } },
      { characters: [VAN.marco] },
    );
    play(g, g.find('p1', 'hand', MR0));
    const seen = giveEach(g, 2);
    expect(seen).toHaveLength(2);
    expect(g.card(g.find('p2', 'characters', VAN.marco)).don).toBe(0);
    expect(donsOn(g)).toEqual([2, 2]);
  });
});

describe('OP18-046 Mr.0 & Ms. All Sunday: [On Your Opponent’s Attack] trash 1: a Baroque Works Leader’s base power becomes 7000', () => {
  /** p2's turn: Hajrudin (6000) attacks p1's Leader. */
  function attacked(leader: string = CROC, p1: Partial<PlayerSpec> = {}): TestGame {
    const g = theirs(
      leader,
      { characters: [MR0], hand: [VAN.sai, VAN.marco], life: fill(VAN.gordon, 4), ...p1 },
      { characters: [VAN.hajrudin] },
    );
    attack(g, g.find('p2', 'characters', VAN.hajrudin), g.leader('p1'));
    return g;
  }

  it('accepting and trashing 1 card: the Leader is 7000 and the 6000 attack does not get through', () => {
    const g = attacked();
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    expect(cardIds(g, 'p1', 'trash')).toEqual([VAN.sai]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });

  it('declining pays nothing: the Leader stays at 5000 and the 6000 attack hits', () => {
    const g = attacked();
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(2);
    noDefence(g);
    expect(g.life('p1')).toBe(3);
  });

  it('"becomes 7000 during this turn": it is still 7000 for the opponent’s next attack of the same turn', () => {
    const g = attacked(CROC, {});
    accept(g);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('a Leader without a Baroque Works type is not changed (Luffy stays 5000)', () => {
    const g = attacked(LDR.luffy);
    if (offered(g, 'p1')) accept(g);
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the cost needs a card in hand: with an empty hand the effect cannot be used', () => {
    const g = attacked(CROC, { hand: [] });
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
