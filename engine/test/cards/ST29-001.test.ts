/** ST29-001 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, expectDecision, hand, V } from './helpers.ts';
import { attackLeader, finishBattle, lifeOf, mk } from './helpers-st29old.ts';

const ID = 'ST29-001';
const start = (life: number, chars: string[] = []) =>
  mk({ leader: ID, life: lifeOf(life), hand: [V.c1, V.c2], characters: chars });

describe('ST29-001 Monkey.D.Luffy', () => {
  it('[When Attacking] with 2 Life: draws 1, then trashes 1 card from your hand', () => {
    const g = start(2);
    attackLeader(g, g.leader('p1'));
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1')).toHaveLength(3); // the draw already happened
    g.act({ type: 'pick', choice: g.find('p1', 'hand', V.c1) });
    expect(hand(g, 'p1').sort()).toEqual([BLUE, V.c2].sort());
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([V.c1]);
    finishBattle(g);
  });

  it('boundary: 3 Life does not fire, 2 and 1 and 0 do', () => {
    const g = start(3);
    attackLeader(g, g.leader('p1'));
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(dec(g)?.kind).not.toBe('choose');
    for (const n of [2, 1, 0]) {
      const h = start(n);
      attackLeader(h, h.leader('p1'));
      expectDecision(h, 'choose', 'p1');
      expect(hand(h, 'p1')).toHaveLength(3);
    }
  });

  it('the trashed card may be the one just drawn (a mandatory trash of any card in hand)', () => {
    const g = start(2);
    attackLeader(g, g.leader('p1'));
    g.act({ type: 'pick', choice: g.find('p1', 'hand', BLUE) });
    expect(hand(g, 'p1').sort()).toEqual([V.c1, V.c2].sort());
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([BLUE]);
  });

  it('the trash is not optional: no decline is offered', () => {
    const g = start(2);
    attackLeader(g, g.leader('p1'));
    expect(g.isLegal({ type: 'done', player: 'p1' })).toBe(false);
  });

  it('must not fire when a Character attacks (a Leader ability), even with 2 Life', () => {
    const g = start(2, [V.c1]);
    attackLeader(g, g.find('p1', 'characters', V.c1));
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(dec(g)?.kind).not.toBe('choose');
  });
});
