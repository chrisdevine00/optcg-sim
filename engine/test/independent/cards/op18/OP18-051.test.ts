/**
 * OP18-051 Mr.4 & Miss.MerryChristmas (Character, Blue, cost 2, 3000, Counter +1000, {Baroque Works}).
 *
 * Card text (cards/data):
 *   "[DON!! x1] This Character gains +1000 power.
 *    [On Play] You may rest 5 of your DON!! cards: Place up to 1 Character with a cost of 6 or less
 *    and up to 1 Character with a cost of 5 or less at the bottom of the owner's deck in any order
 *    of the owner's choosing."
 *
 * Rules: the cost (rest 5 active DON!!) is paid first and only if I choose to (CR 8-3-1); the two
 * "up to 1" picks are independent and are two different cards; any Character of either player
 * qualifies (cost 6 or less for the first, 5 or less for the second); each card goes to the bottom
 * of its OWNER's deck.
 *
 * Scenery (vanilla): OP02-007 Thatch (cost 6), OP02-006 Kingdew (cost 5), OP01-018 Hajrudin (cost
 * 4), OP01-023 Marco (cost 3), OP10-050 Hajrudin (cost 7).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  cardIds,
  choices,
  decline,
  describeDonPlus,
  donOf,
  kind,
  mine,
  need,
  offered,
  VAN,
  fill,
} from './kit-d.ts';

const MR4 = 'OP18-051';
const THATCH6 = 'OP02-007';
const KINGDEW5 = 'OP02-006';
const HAJ4 = 'OP01-018';
const MARCO3 = 'OP01-023';
const HAJ7 = 'OP10-050';

describeDonPlus(MR4, 3000);

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  return mine(
    'ST03-001',
    { hand: [MR4], costArea: { active: 8, rested: 0 }, ...p1 },
    { characters: [THATCH6, KINGDEW5, HAJ4, MARCO3, HAJ7], deck: fill('P-015', 10), ...p2 },
  );
}

function start(g: TestGame) {
  play(g, g.find('p1', 'hand', MR4));
  need(g, 'optional', 'p1');
  accept(g);
}

const ch = (g: TestGame, card: string) => g.find('p2', 'characters', card);

describe('OP18-051 Mr.4 & Miss.MerryChristmas: [On Play] rest 5 DON!!: bottom-deck a Character (cost 6 or less) and a Character (cost 5 or less)', () => {
  it('pays 5 DON!! and places both Characters at the bottom of their owner’s deck', () => {
    const g = game();
    start(g);
    const thatch = ch(g, THATCH6);
    act(g, { type: 'pick', choice: thatch });
    act(g, { type: 'pick', choice: ch(g, KINGDEW5) });
    // Two cards of the same owner: the owner (p2) orders them.
    need(g, 'order', 'p2');
    act(g, { type: 'order', first: thatch });
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p2', 'characters').sort()).toEqual([HAJ4, HAJ7, MARCO3].sort());
    const deck = cardIds(g, 'p2', 'deck');
    expect(deck).toHaveLength(12);
    expect(deck.slice(-2).sort()).toEqual([KINGDEW5, THATCH6].sort());
    // 8 active - 2 (cost) - 5 (rest) = 1 active; 7 rested.
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 7 });
  });

  it('"in any order of the owner’s choosing": the owner picks the order, and either order is possible', () => {
    for (const [a, b] of [
      [THATCH6, KINGDEW5],
      [KINGDEW5, THATCH6],
    ] as const) {
      const g = game();
      start(g);
      act(g, { type: 'pick', choice: ch(g, THATCH6) });
      act(g, { type: 'pick', choice: ch(g, KINGDEW5) });
      need(g, 'order', 'p2');
      const opts = g.legal().filter((x) => x.type === 'order');
      const first = opts.find((x) => x.type === 'order' && g.card(x.first).card === a);
      expect(first).toBeTruthy();
      g.act(first!);
      expect(cardIds(g, 'p2', 'deck').slice(-2)).toEqual([a, b]);
    }
  });

  it('the first pick allows cost 6 but not cost 7', () => {
    const g = game();
    start(g);
    const first = choices(g);
    expect(first).toContain(ch(g, THATCH6));
    expect(first).toContain(ch(g, KINGDEW5));
    expect(first).not.toContain(ch(g, HAJ7));
  });

  it('the second pick allows cost 5 but not cost 6 or 7, and not the card already chosen', () => {
    const g = game();
    start(g);
    act(g, { type: 'pick', choice: ch(g, KINGDEW5) });
    const second = choices(g);
    expect(second).not.toContain(ch(g, THATCH6));
    expect(second).not.toContain(ch(g, HAJ7));
    expect(second).not.toContain(ch(g, KINGDEW5));
    expect(second).toContain(ch(g, HAJ4));
    expect(second).toContain(ch(g, MARCO3));
  });

  it('my own Characters qualify too, and go to the bottom of my deck (Mr.4 himself is cost 2)', () => {
    const g = game(
      { characters: [VAN.sai], deck: fill('OP02-060', 6) },
      { characters: [KINGDEW5] },
    );
    start(g);
    expect(choices(g)).toContain(g.find('p1', 'characters', VAN.sai));
    expect(choices(g)).toContain(g.find('p1', 'characters', MR4));
    act(g, { type: 'pick', choice: g.find('p1', 'characters', VAN.sai) });
    act(g, { type: 'pick', choice: ch(g, KINGDEW5) });
    expect(cardIds(g, 'p1', 'deck').slice(-1)).toEqual([VAN.sai]);
    expect(cardIds(g, 'p2', 'deck').slice(-1)).toEqual([KINGDEW5]);
  });

  it('"up to 1" each: choosing none for both leaves the board unchanged, and the 5 DON!! stay rested', () => {
    const g = game();
    start(g);
    act(g, { type: 'done' });
    act(g, { type: 'done' });
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(5);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 7 });
  });

  it('only 1 Character with a cost of 6 or less: it can be placed and the second pick can be empty', () => {
    const g = game({}, { characters: [THATCH6] });
    start(g);
    act(g, { type: 'pick', choice: ch(g, THATCH6) });
    if (kind(g) === 'choose') {
      expect(choices(g).filter((i) => i !== g.find('p1', 'characters', MR4))).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
  });

  it('declining the cost: nothing is rested and nothing is placed', () => {
    const g = game();
    play(g, g.find('p1', 'hand', MR4));
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(kind(g)).toBe('main');
    expect(donOf(g, 'p1')).toMatchObject({ active: 6, rested: 2 });
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(5);
  });

  it('with fewer than 5 DON!! left after paying 2 for Mr.4 the cost cannot be paid', () => {
    const g = game({ costArea: { active: 6, rested: 0 } });
    play(g, g.find('p1', 'hand', MR4));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(5);
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 2 });
  });
});
