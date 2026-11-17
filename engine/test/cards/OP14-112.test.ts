/** OP14-112 Boa Hancock. QA-GR: adding a Life card to the hand is not damage. */
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
  PURPLE,
  V,
} from './helpers.ts';
import { damageGame, EMET, HANCOCK, MONET, ROSI } from './helpers-hancock-rosi.ts';

describe('OP14-112 Boa Hancock', () => {
  const start = (leader: string) => {
    const g = game(
      {
        leader,
        hand: ['OP14-112'],
        deck: [V.c1, BLUE],
        costArea: { active: 9, rested: 0 },
      },
      { leader: PLAIN_BLUE, life: [MONET, PURPLE, PURPLE] },
    );
    play(g, 'OP14-112');
    return g;
  };

  it('[On Play] with a Warlord Leader: top of deck to your Life, then the opponent top Life card to their hand', () => {
    const g = start(HANCOCK);
    accept(g); // add the top card of your deck to your Life
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c1);
    accept(g); // add the opponent's top Life card to its owner's hand
    expect(g.life('p2')).toBe(2);
    expect(hand(g, 'p2')).toEqual([MONET]);
    // Not damage: no [Trigger] decision for the opponent.
    expectDecision(g, 'main', 'p1');
  });

  it('each step is "up to 1" and can be declined on its own', () => {
    const g = start(HANCOCK);
    decline(g);
    expect(g.life('p1')).toBe(3);
    accept(g);
    expect(g.life('p2')).toBe(2);
    const h = start(HANCOCK);
    accept(h);
    decline(h);
    expect(h.life('p1')).toBe(4);
    expect(h.life('p2')).toBe(3);
  });

  it('does nothing without a {The Seven Warlords of the Sea} Leader (both clauses are gated)', () => {
    const g = start(ROSI);
    expectDecision(g, 'main', 'p1');
    expect(g.life('p1')).toBe(3);
    expect(g.life('p2')).toBe(3);
  });

  it('[Trigger] plays a Character with 6000 power or less and a [Trigger] from your hand', () => {
    const g = damageGame('OP14-112', { leader: HANCOCK, hand: [V.c4, EMET, MONET] });
    g.act({ type: 'trigger', activate: true });
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'hand', MONET)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([MONET]);
  });
});
