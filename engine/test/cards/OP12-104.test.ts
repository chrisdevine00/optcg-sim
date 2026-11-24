/** OP12-104 Sentomaru. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, trash, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { cardsIn, offered, RA_LEADER } from './helpers-op12g3.ts';

const ID = 'OP12-104';

describe('OP12-104 Sentomaru', () => {
  it("[Trigger] K.O.s up to 1 of the opponent's Characters with cost 4 or less (5 and the attacker are out)", () => {
    const g = damageGame(ID, { leader: RA_LEADER }, { characters: [V.c4, V.c5, V.c1] });
    g.act({ type: 'trigger', activate: true });
    expect(offered(g).sort()).toEqual(
      [g.find('p2', 'characters', V.c4), g.find('p2', 'characters', V.c1)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(trash(g, 'p2')).toEqual([V.c4]);
    expect(cardsIn(g, 'p2', 'characters').sort()).toEqual([V.c7, V.c5, V.c1].sort());
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = damageGame(ID, { leader: RA_LEADER }, { characters: [V.c4] });
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(cardsIn(g, 'p2', 'characters')).toContain(V.c4);
    expect(trash(g, 'p2')).toHaveLength(0);
  });

  it('boundary: with no Character of cost 4 or less nothing is asked', () => {
    const g = damageGame(ID, { leader: RA_LEADER }, { characters: [V.c5, V.c6] });
    g.act({ type: 'trigger', activate: true });
    expect(dec(g)?.kind).toBe('main');
    expect(cardsIn(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('declining the [Trigger] adds the card to the hand and K.O.s nothing', () => {
    const g = damageGame(ID, { leader: RA_LEADER }, { characters: [V.c4] });
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1')).toEqual([ID]);
    expect(cardsIn(g, 'p2', 'characters')).toContain(V.c4);
    expectDecision(g, 'main', 'p2');
  });
});
