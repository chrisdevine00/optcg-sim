/** PRB02-001 Koby. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, expectDecision, hand, none, pick, times, V } from './helpers.ts';
import { buff, mk, NAVY_LEADER, PLAIN_PURPLE_LEADER, cardsIn } from './helpers-prbst.ts';

const ID = 'PRB02-001';

describe('PRB02-001 Koby', () => {
  const start = (p1 = {}, p2 = {}, extra = {}) =>
    mk({ leader: NAVY_LEADER, characters: [ID], hand: times(3, BLUE), ...p1 }, p2, extra);
  const attack = (g: ReturnType<typeof start>) =>
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', ID),
      target: g.leader('p2'),
    });

  it("[Opponent's Turn]: with a {Navy} Leader it has +1000 power on the opponent's turn only", () => {
    const own = start();
    expect(own.power(own.find('p1', 'characters', ID))).toBe(5000);
    const opp = start({}, {}, { turn: 4, activePlayer: 'p2' });
    expect(opp.power(opp.find('p1', 'characters', ID))).toBe(6000);
  });

  it("must not fire: without a {Navy} Leader there is no +1000 on the opponent's turn", () => {
    const g = start({ leader: PLAIN_PURPLE_LEADER }, {}, { turn: 4, activePlayer: 'p2' });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
  });

  it('[When Attacking]: K.O.s a Character with 3000 base power (boundary), then draws with 6 or less in hand', () => {
    const g = start({}, { characters: [V.c1, V.c2] });
    attack(g);
    expectDecision(g, 'choose', 'p1');
    // Only the 3000 base power Character is a candidate (4000 is not).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c2]);
    expect(hand(g, 'p1')).toHaveLength(4);
  });

  it('base power is the printed one: a 3000 Character buffed above 3000 can still be K.O.d, a 4000 one lowered cannot', () => {
    const g = start({}, { characters: [V.c1, V.c2] });
    buff(g, g.find('p2', 'characters', V.c1), 2000, 'p2');
    buff(g, g.find('p2', 'characters', V.c2), -2000, 'p1');
    attack(g);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c2]);
  });

  it('"up to 1": the K.O. may be skipped, and the draw still happens (it is not "if you do")', () => {
    const g = start({}, { characters: [V.c1] });
    attack(g);
    none(g);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toHaveLength(4);
  });

  it('with 7 cards in hand nothing is drawn; 6 is the boundary (checked after the K.O.)', () => {
    const seven = start({ hand: times(7, BLUE) }, { characters: [V.c1] });
    attack(seven);
    pick(seven, [seven.find('p2', 'characters', V.c1)]);
    expect(hand(seven, 'p1')).toHaveLength(7);
    const six = start({ hand: times(6, BLUE) }, { characters: [V.c1] });
    attack(six);
    pick(six, [six.find('p2', 'characters', V.c1)]);
    expect(hand(six, 'p1')).toHaveLength(7);
  });

  it('with no K.O. target the draw still happens and no prompt is left open', () => {
    const g = start({}, { characters: [V.c2] });
    attack(g);
    if (dec(g)?.kind === 'choose') none(g);
    expect(hand(g, 'p1')).toHaveLength(4);
  });
});
