/** ST29-008 Nami. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, pick, PLAIN_BLUE, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { cardsIn, EGG4, koBy, LUFFY_LEADER, mk, plantOpponentEffect } from './helpers-st29old.ts';

const ID = 'ST29-008';
const koOne = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };

describe('ST29-008 Nami', () => {
  // p2 plants an effect on their own turn that K.O.s one of p1's Characters.
  const byOpponent = (target: string) => {
    const g = mk(
      { characters: [ID, EGG4, V.c4], life: [V.c1, V.c2, V.c3] },
      {},
      {
        turn: 4,
        activePlayer: 'p2',
      },
    );
    plantOpponentEffect(g, koOne);
    pick(g, [g.find('p1', 'characters', target)]);
    return g;
  };

  it("an {Egghead} Character that would be K.O.'d by your opponent's effect stays: turn the top Life card face-up instead", () => {
    const g = byOpponent(EGG4);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(cardsIn(g, 'p1', 'characters')).toContain(EGG4);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.life('p1')).toBe(3);
  });

  it('may be declined: the Character is K.O.d and the Life stays face-down', () => {
    const g = byOpponent(EGG4);
    decline(g);
    expect(cardsIn(g, 'p1', 'characters')).not.toContain(EGG4);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
  });

  it('covers Nami herself (she is an {Egghead})', () => {
    const g = byOpponent(ID);
    accept(g);
    expect(cardsIn(g, 'p1', 'characters')).toContain(ID);
  });

  it('must not cover a Character that is not {Egghead}', () => {
    const g = byOpponent(V.c4);
    expect(dec(g)?.kind).toBe('main');
    expect(cardsIn(g, 'p1', 'characters')).not.toContain(V.c4);
  });

  it('must not cover your own effect, nor a bounce (K.O. by the opponent only)', () => {
    const g = mk({ characters: [ID, EGG4], life: [V.c1] }, {}, { turn: 4, activePlayer: 'p2' });
    koBy(g, 'p1', EGG4, 'p1');
    expect(cardsIn(g, 'p1', 'characters')).not.toContain(EGG4);
    const h = mk({ characters: [ID, EGG4], life: [V.c1] }, {}, { turn: 4, activePlayer: 'p2' });
    plantOpponentEffect(h, {
      move: {
        what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
        to: { zone: 'hand' },
      },
    });
    pick(h, [h.find('p1', 'characters', EGG4)]);
    expect(dec(h)?.kind).toBe('main');
    expect(cardsIn(h, 'p1', 'hand')).toContain(EGG4);
  });

  it('[Trigger]: plays this card with a [Monkey.D.Luffy] Leader, not with another', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER });
    g.act({ type: 'trigger', activate: true });
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    const h = damageGame(ID, { leader: PLAIN_BLUE });
    h.act({ type: 'trigger', activate: true });
    expect(cardsIn(h, 'p1', 'characters')).toEqual([]);
  });
});
