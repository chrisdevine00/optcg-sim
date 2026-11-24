/** EB03-056 Belo Betty. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, cardsIn, costMod, mk } from './helpers-eb03g2.ts';

const ID = 'EB03-056';
const life = [V.c1, V.c2, V.c3];

describe('EB03-056 Belo Betty', () => {
  it('[On Play] turn the top Life card face-up: K.O.s a Character with a base cost of 3 or less', () => {
    const g = mk({ hand: [ID], life }, { characters: [V.c3, V.c4] });
    play(g, ID);
    accept(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.zone('p1', 'life')[1]!.faceUp).toBe(false);
    expect(g.life('p1')).toBe(3);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false); // base cost 4
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c4]);
  });

  it('reads the BASE cost: a cost-3 Character raised to 5 is a target, a cost-5 lowered to 3 is not', () => {
    const g = mk({ hand: [ID], life }, { characters: [V.c3, V.c5] });
    costMod(g, g.find('p2', 'characters', V.c3), 2);
    costMod(g, g.find('p2', 'characters', V.c5), -2);
    play(g, ID);
    accept(g);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
  });

  it('the cost is optional: declining leaves the Life face-down and K.O.s nothing', () => {
    const g = mk({ hand: [ID], life }, { characters: [V.c3] });
    play(g, ID);
    decline(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c3]);
    expectDecision(g, 'main', 'p1');
  });

  it('"up to 1": after turning the Life face-up the K.O. may be left', () => {
    const g = mk({ hand: [ID], life }, { characters: [V.c3] });
    play(g, ID);
    accept(g);
    none(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c3]);
  });

  it('the top Life card must be face-down: with it already face-up the cost cannot be paid', () => {
    const g = mk(
      { hand: [ID], life: [{ card: V.c1, faceUp: true }, V.c2, V.c3] },
      { characters: [V.c3] },
    );
    play(g, ID);
    // Whatever is shown, accepting is not legal and the Character survives.
    if (g.legal().some((a) => a.type === 'optional')) {
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(g);
    }
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c3]);
    expectDecision(g, 'main', 'p1');
  });
});
