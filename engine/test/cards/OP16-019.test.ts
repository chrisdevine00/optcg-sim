/** OP16-019 Let's Show 'Em What We're Made Of!! */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, hand, none, pick, play, PLAIN_BLUE } from './helpers.ts';
import { damageWithP2 } from './helpers-rgl-penel.ts';
import { idsIn, NON_WB8, offers, RED_LEADER, WB7, WB8, WB8B, WB9 } from './helpers-op16g1.ts';

const ID = 'OP16-019';
/** OP02-007: Red, cost 6, 8000, {Whitebeard Pirates}. */
const WB8C = 'OP02-007';

describe("OP16-019 Let's Show 'Em What We're Made Of!!", () => {
  const start = () =>
    game(
      {
        leader: RED_LEADER,
        hand: [ID, WB8, WB8B, WB8C, WB7, WB9, NON_WB8],
        costArea: { active: 9, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );

  it('[Main]: play up to 2 Character cards with a Whitebeard Pirates type and 8000 power from your hand', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    // Exactly 8000: not 7000 or 9000, and not a non-Whitebeard 8000.
    for (const c of [WB8, WB8B, WB8C]) expect(offers(g, g.find('p1', 'hand', c))).toBe(true);
    for (const c of [WB7, WB9, NON_WB8]) expect(offers(g, g.find('p1', 'hand', c))).toBe(false);
    pick(g, [g.find('p1', 'hand', WB8), g.find('p1', 'hand', WB8C)]);
    expect(idsIn(g, 'p1', 'characters').sort()).toEqual([WB8, WB8C].sort());
    expect(hand(g, 'p1')).toContain(WB8B);
    expectDecision(g, 'main', 'p1');
  });

  it('"up to 2": a third Character cannot be chosen, and fewer (or none) may be', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'hand', WB8)]);
    expect(idsIn(g, 'p1', 'characters')).toEqual([WB8]);
    const g2 = start();
    play(g2, ID);
    none(g2);
    expect(idsIn(g2, 'p1', 'characters')).toEqual([]);
  });

  it('costs 9: it cannot be played with 8 DON!!', () => {
    const g = game(
      { leader: RED_LEADER, hand: [ID, WB8], costArea: { active: 8, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    expect(g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', ID), player: 'p1' })).toBe(
      false,
    );
  });

  it('[Trigger]: your Leader gains +1000 power during this turn', () => {
    const g = damageWithP2(ID, {}, undefined, RED_LEADER);
    expect(g.power(g.leader('p1'))).toBe(5000);
    g.act({ type: 'trigger', activate: true });
    expect(g.power(g.leader('p1'))).toBe(6000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
