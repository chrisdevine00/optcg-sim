/** ST29-013 Rob Lucci. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, PURPLE, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { canPick, cardsIn, LUFFY_LEADER } from './helpers-st29old.ts';

const ID = 'ST29-013';

// damageGame: p1's life is [Lucci, PURPLE] (2 cards); the damage takes Lucci's card, leaving 1.
// With p2 given `n` extra Life cards the bound is p1's remaining Life + p2's Life.
const start = (p2life: number, chars: string[]) => {
  const g = damageGame(
    ID,
    { leader: LUFFY_LEADER },
    {
      characters: chars,
      life: Array.from({ length: p2life }, () => PURPLE),
    },
  );
  g.act({ type: 'trigger', activate: true });
  return g;
};

describe('ST29-013 Rob Lucci', () => {
  it("[Trigger]: K.O.s up to 1 opposing Character with a cost of at most the total of both players' Life", () => {
    // p1 has 1 Life left, p2 has 3: the total is 4.
    const g = start(3, [V.c4, V.c5]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true); // 4 = 1 + 3
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(cardsIn(g, 'p2', 'characters')).not.toContain(V.c4);
    expect(cardsIn(g, 'p2', 'characters')).toContain(V.c5);
  });

  it('boundary: one fewer Life on the opponent side makes the cost 4 Character safe', () => {
    const g = start(2, [V.c4, V.c3]);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false); // total 3
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = start(3, [V.c1]);
    none(g);
    expect(cardsIn(g, 'p2', 'characters')).toContain(V.c1);
  });

  it('the bound counts the Life left after the damage (the Life card that carried the Trigger is gone)', () => {
    const g = start(0, [V.c1, V.c2]);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true); // total is 1
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
  });

  it('must not reach the Leader', () => {
    const g = start(3, [V.c1]);
    expect(canPick(g, g.leader('p2'))).toBe(false);
  });
});
