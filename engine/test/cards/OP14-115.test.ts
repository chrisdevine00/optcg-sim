/** OP14-115 Rindo. */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { accept, decline, dec, expectDecision, game, hand, PLAIN_BLUE, V } from './helpers.ts';
import { damageWith } from './triggers.ts';
import { koBy } from './helpers-w3s.ts';
import { cardsIn, finishBattle, KUJA_LEADER } from './helpers-w4sb.ts';

const ID = 'OP14-115';

/** p2 attacks p1's rested Rindo with a 9000 Character and wins the battle: [On K.O.] is next. */
function koed(life = [V.c1, V.c2, V.c3], deck = [V.c4, V.c5, V.c6]) {
  const g = game(
    { leader: KUJA_LEADER, characters: [{ card: ID, rested: true }], life, deck },
    { leader: PLAIN_BLUE, characters: [V.c7] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', V.c7),
    target: g.find('p1', 'characters', ID),
  });
  finishBattle(g);
  return g;
}

describe('OP14-115 Rindo', () => {
  it("[Opponent's Turn] [On K.O.]: adds the top deck card to Life, then you take 1 damage", () => {
    const g = koed();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    // The added card is the top Life card, so the damage takes it: it goes to the hand.
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(3);
    expect(hand(g, 'p1')).toEqual([V.c4]);
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual([V.c5, V.c6]);
  });

  it('declining the add: the damage still happens ("Then" is not "if you do")', () => {
    const g = koed();
    decline(g);
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it('boundary: with 0 Life the added card absorbs the damage, so you survive; declining loses', () => {
    const g = koed([]);
    accept(g);
    g.act({ type: 'trigger', activate: false });
    expect(queries.result(g.state)).toBeNull();
    expect(g.life('p1')).toBe(0);
    expect(hand(g, 'p1')).toEqual([V.c4]);
    const h = koed([]);
    decline(h);
    expect(queries.result(h.state)).toMatchObject({ winner: 'p2' });
  });

  it('must not fire when K.O.’d on your own turn', () => {
    const g = game(
      { leader: KUJA_LEADER, characters: [ID], life: [V.c1, V.c2, V.c3], deck: [V.c4] },
      { leader: PLAIN_BLUE },
    );
    koBy(g, 'p1', ID, 'p1');
    expect(dec(g)?.kind).toBe('main');
    expect(g.life('p1')).toBe(3);
    expect(cardsIn(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('[Trigger]: with a {Kuja Pirates} Leader plays this card', () => {
    const g = damageWith(ID, { leader: KUJA_LEADER });
    g.act({ type: 'trigger', activate: true });
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('[Trigger]: with another Leader nothing is played and the card is trashed', () => {
    const g = damageWith(ID);
    g.act({ type: 'trigger', activate: true });
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
    expect(cardsIn(g, 'p1', 'trash')).toEqual([ID]);
  });
});
