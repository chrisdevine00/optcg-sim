/** OP07-077 We're Going to Claim the One Piece!!! */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import {
  expectDecision,
  game,
  hand,
  KAIDO,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { damageWith } from './triggers.ts';

describe("OP07-077 We're Going to Claim the One Piece!!!", () => {
  const deck = [PURPLE, V.c6, PURPLE, 'EB04-031', PURPLE, V.c1];

  it('[Main]: look at 5, reveal an Animal Kingdom Pirates card to hand, the rest to the bottom in a chosen order', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP07-077'], deck, costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP07-077');
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.purpose).toBe('target');
    const v = project(g.state, 'p1') as unknown as { looking: { card: string }[] };
    expect(v.looking).toHaveLength(5);
    // Only the 2 AKP cards (OP01-110, EB04-031) are offered.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'deck', 'EB04-031')]);
    expect(hand(g, 'p1')).toEqual(['EB04-031']);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe('EB04-031');
    // 4 left: 3 order decisions.
    for (let i = 0; i < 3; i++) {
      expectDecision(g, 'order', 'p1');
      g.act(g.legal().find((a) => a.type === 'order')!);
    }
    expectDecision(g, 'main', 'p1');
    const cards = g.zone('p1', 'deck').map((c) => c.card);
    expect(cards[0]).toBe(V.c1);
    expect(cards.slice(1).sort()).toEqual([PURPLE, PURPLE, PURPLE, V.c6].sort());
  });

  it('a search may whiff even with a match (CR 8-4-4-2)', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP07-077'], deck, costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP07-077');
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it("[Trigger] activates this card's [Main]", () => {
    const g = damageWith('OP07-077', { deck });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', V.c6)]);
    expect(hand(g, 'p1')).toContain(V.c6);
  });
});
