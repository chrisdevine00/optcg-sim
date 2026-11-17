/** OP05-115 Two-Hundred Million Volts Amaru: [Main] +3000, rest with 1 or less Life; [Trigger] trash 2: deck top to Life. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { damageWith, ids, KAL } from './helpers-kalgara.ts';

const AMARU = 'OP05-115';

const main = (life: string[]) =>
  game(
    {
      leader: KAL,
      hand: [AMARU],
      life,
      characters: [V.c1],
      costArea: { active: 2, rested: 0 },
    },
    { leader: PLAIN_BLUE, characters: [V.c4, V.c5] },
  );

describe('OP05-115 Two-Hundred Million Volts Amaru', () => {
  it('[Main] +3000 power during this turn to a Leader or Character', () => {
    const g = main([V.c2, V.c3]);
    play(g, AMARU);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(6000);
    // With 2 Life nothing is rested.
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(false);
    expectDecision(g, 'main', 'p1');
  });

  it('the +3000 lasts until the end of the turn', () => {
    const g = main([V.c2, V.c3]);
    play(g, AMARU);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with 1 or less Life also rests a Character with cost 4 or less', () => {
    const g = main([V.c2]);
    play(g, AMARU);
    pick(g, [g.leader('p1')]);
    // Only the cost-4 Character is a legal target (cost 5 is too high).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });

  it('with 0 Life the rest still applies', () => {
    const g = main([]);
    play(g, AMARU);
    pick(g, [g.leader('p1')]);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(true);
  });

  it('[Trigger] trash 2 cards from your hand: add the top deck card to the top of Life', () => {
    const g = damageWith(AMARU, { hand: [BLUE, V.c1, V.c2], deck: [V.c6, BLUE] });
    g.act({ type: 'trigger', activate: true }); // activating is the "you may"; the cost is then paid
    pick(g, [g.find('p1', 'hand', BLUE), g.find('p1', 'hand', V.c1)]);
    accept(g); // up to 1: add the card
    expect(ids(g.zone('p1', 'trash')).sort()).toEqual([AMARU, BLUE, V.c1].sort());
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c6);
    expect(g.life('p1')).toBe(2); // one left from the hit, one added
  });

  it('[Trigger] is a "you may": not activating trashes nothing and adds nothing', () => {
    const g = damageWith(AMARU, { hand: [BLUE, V.c1], deck: [V.c6] });
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1').sort()).toEqual([AMARU, BLUE, V.c1].sort());
    expect(g.life('p1')).toBe(1);
  });

  it('[Trigger] "up to 1": after paying, the deck card may be left out', () => {
    const g = damageWith(AMARU, { hand: [BLUE, V.c1], deck: [V.c6] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', BLUE), g.find('p1', 'hand', V.c1)]);
    decline(g);
    expect(g.life('p1')).toBe(1);
    expect(g.zone('p1', 'trash')).toHaveLength(3);
  });

  it('[Trigger] cannot be paid with fewer than 2 cards in hand', () => {
    const g = damageWith(AMARU, { hand: [BLUE], deck: [V.c6] });
    // The cost cannot be paid, so activating is not offered.
    expect(g.isLegal({ type: 'trigger', activate: true, player: 'p1' })).toBe(false);
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1').sort()).toEqual([AMARU, BLUE].sort());
    expect(g.life('p1')).toBe(1);
  });
});
