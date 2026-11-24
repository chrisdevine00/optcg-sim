/** ST29-014 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { dec, expectDecision, hand, pick, V } from './helpers.ts';
import { activate, canPick, cardsIn, mk, TRG } from './helpers-st29old.ts';

const ID = 'ST29-014';
const start = (handCards: string[], rested = 2) =>
  mk({ characters: [ID, V.c1], hand: handCards, costArea: { active: 3, rested } });

describe('ST29-014 Roronoa Zoro', () => {
  it('prints [Rush: Character]: it can attack a Character the turn it is played, not the Leader', () => {
    const g = mk(
      { hand: [ID], costArea: { active: 10, rested: 0 } },
      { characters: [{ card: V.c1, rested: true }] },
    );
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    const z = g.find('p1', 'characters', ID);
    expect(
      g.isLegal({
        type: 'attack',
        attacker: z,
        target: g.find('p2', 'characters', V.c1),
        player: 'p1',
      }),
    ).toBe(true);
    expect(g.isLegal({ type: 'attack', attacker: z, target: g.leader('p2'), player: 'p1' })).toBe(
      false,
    );
  });

  it('[Activate: Main]: trash a [Trigger] card from hand: draw 1, give 1 rested DON!! to the Leader or a Character', () => {
    const g = start([TRG, V.c2]);
    activate(g, g.find('p1', 'characters', ID), 'draw-don');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', TRG))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', V.c2))).toBe(false); // no [Trigger]
    pick(g, [g.find('p1', 'hand', TRG)]);
    expect(hand(g, 'p1')).toHaveLength(2); // V.c2 and the drawn card
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ rested: 1, given: 1 });
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(4000);
    expect(cardsIn(g, 'p1', 'trash')).toEqual([TRG]);
  });

  it('may give to the Leader or to Zoro himself', () => {
    const g = start([TRG]);
    activate(g, g.find('p1', 'characters', ID), 'draw-don');
    pick(g, [g.find('p1', 'hand', TRG)]);
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('must not activate without a [Trigger] card in hand (the cost cannot be paid)', () => {
    const g = start([V.c2, V.c3]);
    expect(
      g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'characters', ID)),
    ).toBe(false);
  });

  it('with no rested DON!! the card is still drawn and nothing is given; Once Per Turn', () => {
    const g = start([TRG, TRG], 0);
    activate(g, g.find('p1', 'characters', ID), 'draw-don');
    pick(g, [g.find('p1', 'hand', TRG)]);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(queries.don(g.state, 'p1')).toMatchObject({ rested: 0, given: 0 });
    expect(dec(g)?.kind).toBe('main');
    expect(
      g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'characters', ID)),
    ).toBe(false);
  });
});
