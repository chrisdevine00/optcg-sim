/** ST29-007 Tony Tony.Chopper. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, hand, option, pick, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { cardsIn, koBy, LUFFY_C, LUFFY_LEADER, mk } from './helpers-st29old.ts';

const ID = 'ST29-007';
// Life, top first: distinct ids so the top and the bottom can be told apart.
const LIFE = [V.c1, V.c2, V.c3];

describe('ST29-007 Tony Tony.Chopper', () => {
  const koed = (hand: string[] = [V.c4]) => {
    const g = mk({ characters: [ID], hand, life: LIFE });
    koBy(g, 'p1', ID, 'p2');
    return g;
  };

  it('[On K.O.]: take the top Life card to your hand, then put a card from your hand on top of Life', () => {
    const g = koed();
    accept(g);
    option(g, 'top');
    expect(hand(g, 'p1').sort()).toEqual([V.c1, V.c4].sort());
    expect(g.life('p1')).toBe(2);
    pick(g, [g.find('p1', 'hand', V.c4)]);
    expect(g.life('p1')).toBe(3);
    expect(cardsIn(g, 'p1', 'life')).toEqual([V.c4, V.c2, V.c3]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('the Life card may come from the bottom', () => {
    const g = koed();
    accept(g);
    option(g, 'bottom');
    expect(hand(g, 'p1').sort()).toEqual([V.c3, V.c4].sort());
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expect(cardsIn(g, 'p1', 'life')).toEqual([V.c3, V.c1, V.c2]);
  });

  it('"up to 1": after paying the cost the card may be kept in hand (Life stays one lower)', () => {
    const g = koed();
    accept(g);
    option(g, 'top');
    expectDecision(g, 'choose', 'p1');
    g.act({ type: 'done' });
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('declining the optional cost changes nothing; with no Life the cost cannot be paid', () => {
    const g = koed();
    decline(g);
    expect(g.life('p1')).toBe(3);
    const h = mk({ characters: [ID], hand: [V.c4], life: [] });
    koBy(h, 'p1', ID, 'p2');
    expect(dec(h)?.kind).not.toBe('optional');
  });

  it('[Trigger]: up to 1 of your [Monkey.D.Luffy] cards gains +2000 power during this turn', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER, characters: [LUFFY_C, V.c4] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2); // Leader and the Luffy Character
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', V.c4))).toBe(6000);
  });
});
