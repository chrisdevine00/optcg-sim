/** OP07-057 Perfume Femur. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { damageGame, HANCOCK, LAW4, WARLORD } from './helpers-hancock-rosi.ts';

describe('OP07-057 Perfume Femur', () => {
  const start = () => {
    const g = game(
      {
        leader: HANCOCK,
        hand: ['OP07-057'],
        characters: [WARLORD, V.c1],
        costArea: { active: 2, rested: 0 },
      },
      // p2 has a [Blocker] ready.
      { leader: PLAIN_BLUE, characters: [LAW4] },
    );
    play(g, 'OP07-057');
    return g;
  };
  const canBlock = (g: ReturnType<typeof start>, attacker: string) => {
    g.act({ type: 'attack', attacker, target: g.find('p2', 'leader', PLAIN_BLUE) });
    expectDecision(g, 'block', 'p2');
    return g.legal().some((a) => a.type === 'block' && a.blocker !== null);
  };

  it('[Main] a Warlord Character gains +2000 power, and when it attacks the opponent cannot activate [Blocker]', () => {
    const g = start();
    expectDecision(g, 'choose', 'p1');
    // The Leader and the Warlord Character qualify; the other Character does not.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    const target = g.find('p1', 'characters', WARLORD);
    pick(g, [target]);
    expect(g.power(target)).toBe(7000);
    expect(canBlock(g, target)).toBe(false);
  });

  it('the restriction is only on the selected card: another attacker can be blocked', () => {
    const g = start();
    pick(g, [g.find('p1', 'characters', WARLORD)]);
    expect(canBlock(g, g.find('p1', 'characters', V.c1))).toBe(true);
  });

  it('works on a Warlord Leader, which also attacks without being blockable', () => {
    const g = start();
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(canBlock(g, g.leader('p1'))).toBe(false);
  });

  it('selecting nothing changes nothing', () => {
    const g = start();
    none(g);
    expect(canBlock(g, g.find('p1', 'characters', WARLORD))).toBe(true);
  });

  it('[Trigger] draws 1 card', () => {
    const g = damageGame('OP07-057', { leader: HANCOCK, deck: [BLUE, BLUE] });
    g.act({ type: 'trigger', activate: true });
    // The Life card itself is trashed after resolving; the draw is the only card in hand.
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });
});
