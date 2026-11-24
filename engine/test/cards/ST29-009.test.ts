/** ST29-009 Nico Robin. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, PLAIN_BLUE, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { cardsIn, LUFFY_LEADER, mk } from './helpers-st29old.ts';

const ID = 'ST29-009';

describe('ST29-009 Nico Robin', () => {
  it('prints [Blocker]: she can block an attack on the Leader', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3] }, { turn: 4, activePlayer: 'p2' });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    g.act({ type: 'block', blocker: g.find('p1', 'characters', ID) });
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(dec(g)?.kind).toBe('counter');
  });

  it('[Trigger]: with a [Monkey.D.Luffy] Leader, plays this card', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER });
    g.act({ type: 'trigger', activate: true });
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('[Trigger]: must not play with another Leader (the card is trashed)', () => {
    const g = damageGame(ID, { leader: PLAIN_BLUE });
    g.act({ type: 'trigger', activate: true });
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
    expect(cardsIn(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('[Trigger]: declining adds her to the hand', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER });
    g.act({ type: 'trigger', activate: false });
    expect(cardsIn(g, 'p1', 'hand')).toEqual([ID]);
  });
});
