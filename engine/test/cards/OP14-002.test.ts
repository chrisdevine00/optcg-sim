/** OP14-002 Urouge. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, V } from './helpers.ts';
import { attack, boost, finishBattle, mk5, withDon } from './helpers-op14g1.ts';

const ID = 'OP14-002';

const start = (don: number, p2chars: string[] = [V.c1, V.c2]) =>
  mk5({ characters: [withDon(ID, don)] }, { characters: p2chars });

describe('OP14-002 Urouge', () => {
  it('[When Attacking] with 5000 power: draws 1, then K.O.s up to 1 Character with 3000 base power or less', () => {
    const g = start(3);
    attack(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1')).toHaveLength(1); // the draw already happened
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c2]);
    finishBattle(g);
  });

  it('boundary: 4000 power (2 DON!!) does not fire; 5000 does', () => {
    const g = start(2);
    attack(g, g.find('p1', 'characters', ID));
    expect(dec(g)?.kind).not.toBe('choose');
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('reads CURRENT power for the condition: a boost to 5000 enables it', () => {
    const g = start(2);
    boost(g, g.find('p1', 'characters', ID), 1000);
    attack(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('the K.O. reads BASE power: 4000 base is not a target, a boosted 3000-base Character is', () => {
    const g = start(3, [V.c2]);
    attack(g, g.find('p1', 'characters', ID));
    expect(hand(g, 'p1')).toHaveLength(1); // the draw does not depend on a target
    expect(dec(g)?.kind).not.toBe('choose'); // nothing to pick
    const h = start(3, [V.c1]);
    boost(h, h.find('p2', 'characters', V.c1), 3000);
    attack(h, h.find('p1', 'characters', ID));
    pick(h, [h.find('p2', 'characters', V.c1)]);
    expect(h.zone('p2', 'characters')).toHaveLength(0);
  });

  it('"up to 1": may K.O. nothing, the card is still drawn', () => {
    const g = start(3);
    attack(g, g.find('p1', 'characters', ID));
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(hand(g, 'p1')).toHaveLength(1);
  });
});
