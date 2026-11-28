/**
 * OP18-055 Mr.9 & Ms. Wednesday (Character, Blue, cost 3, 4000, Counter +1000, {Baroque Works}).
 *
 * Card text (cards/data):
 *   "[DON!! x1] This Character gains +1000 power.
 *    [On Play] Return up to 1 of your opponent's Characters with a cost of 2 or less to the owner's
 *    hand."
 *
 * Rules: "up to 1" may pick none; only the opponent's Characters qualify; cost 2 is allowed, cost 3
 * is not; the card goes to its owner's hand (CR 3-6-?: it leaves the field; its DON!! return).
 *
 * Scenery: OP01-012 Sai (Red, cost 2), OP01-023 Marco (cost 3), P-015 Sunny-Kun (cost 1), OP01-010
 * Komachiyo (cost 1): vanilla. OP18-054 Mr.8 (Blue, cost 2, {Baroque Works}) for the interplay test.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  BW,
  cardIds,
  choices,
  describeDonPlus,
  kind,
  LDR,
  mine,
  need,
  offered,
  RED,
  settleEmpty,
  side,
  theirTurn,
  VAN,
} from './kit-d.ts';

const MR9 = 'OP18-055';
const MR8 = 'OP18-054';

describeDonPlus(MR9, 4000);

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  const g = mine('ST03-001', { hand: [MR9], characters: [VAN.komachiyo], ...p1 }, p2);
  play(g, g.find('p1', 'hand', MR9));
  return g;
}

describe('OP18-055 Mr.9 & Ms. Wednesday: [On Play] return up to 1 opposing Character (cost 2 or less) to its owner’s hand', () => {
  it('returns the chosen cost 2 Character to its owner’s hand', () => {
    const g = game({}, { characters: [VAN.sai, VAN.marco] });
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p2', 'characters', VAN.sai) });
    expect(cardIds(g, 'p2', 'characters')).toEqual([VAN.marco]);
    expect(cardIds(g, 'p2', 'hand')).toEqual([VAN.sai]);
    expect(kind(g)).toBe('main');
  });

  it('cost boundary: cost 2 and cost 1 are offered, cost 3 is not', () => {
    const g = game({}, { characters: [VAN.sai, VAN.marco, VAN.sunny] });
    expect(choices(g)).toContain(g.find('p2', 'characters', VAN.sai));
    expect(choices(g)).toContain(g.find('p2', 'characters', VAN.sunny));
    expect(choices(g)).not.toContain(g.find('p2', 'characters', VAN.marco));
  });

  it('only the opponent’s Characters: my own cost 1 Character is not offered', () => {
    const g = game({}, { characters: [VAN.sai] });
    expect(choices(g)).toEqual([g.find('p2', 'characters', VAN.sai)]);
  });

  it('"up to 1": picking none returns nothing', () => {
    const g = game({}, { characters: [VAN.sai] });
    act(g, { type: 'done' });
    expect(cardIds(g, 'p2', 'characters')).toEqual([VAN.sai]);
    expect(cardIds(g, 'p2', 'hand')).toEqual([]);
  });

  it('only 1 is returned even with two eligible Characters', () => {
    const g = game({}, { characters: [VAN.sai, VAN.sunny] });
    act(g, { type: 'pick', choice: g.find('p2', 'characters', VAN.sai) });
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p2', 'characters')).toEqual([VAN.sunny]);
  });

  it('a rested eligible Character is returned too, and the DON!! given to it go back to its owner’s cost area', () => {
    const g = game(
      {},
      { characters: [{ card: VAN.sai, rested: true, don: 1 }], costArea: { active: 3, rested: 0 } },
    );
    act(g, { type: 'pick', choice: g.find('p2', 'characters', VAN.sai) });
    expect(cardIds(g, 'p2', 'hand')).toEqual([VAN.sai]);
    expect(g.card(g.find('p2', 'hand', VAN.sai)).don).toBe(0);
  });

  it('with no eligible Character nothing is returned', () => {
    const g = game({}, { characters: [VAN.marco] });
    settleEmpty(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VAN.marco]);
  });

  it('interplay with OP18-054 Mr.8: when the opponent plays Mr.9 against my Mr.8, Mr.8’s replacement is offered', () => {
    const g = theirTurn(
      side('ST03-001', 'OP02-060', { characters: [MR8], hand: [VAN.sai] }),
      side(LDR.luffy, RED, { hand: [MR9], costArea: { active: 3, rested: 0 } }),
    );
    play(g, g.find('p2', 'hand', MR9));
    act(g, { type: 'pick', choice: g.find('p1', 'characters', MR8) });
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    expect(cardIds(g, 'p1', 'characters')).toEqual([MR8]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    void BW;
  });
});
