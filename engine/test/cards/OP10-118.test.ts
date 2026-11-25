/** OP10-118 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { accept, dec, decline, expectDecision, hand, pick, trash, V } from './helpers.ts';
import { cardsOf, koByEffect, SN_LEADER, start, times } from './helpers-a10g4.ts';

const ID = 'OP10-118';
const TRASH = [V.c1, V.c2, V.c3, V.c4];

/** p1 attacks the opponent's Leader with Luffy; the opponent holds `oppHand`. Stops at the first decision. */
function attacking(oppHand: string[], p1trash: string[] = TRASH) {
  const g = start({ characters: [ID], trash: p1trash, deck: [V.c7] }, { hand: oppHand });
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
  return g;
}

describe('OP10-118 Monkey.D.Luffy', () => {
  it('[When Attacking]: place 3 trash cards at the bottom of the deck; with 5+ cards in hand the opponent trashes 1', () => {
    const g = attacking(times(5, V.c1).concat([]));
    accept(g);
    pick(g, [
      g.find('p1', 'trash', V.c1),
      g.find('p1', 'trash', V.c2),
      g.find('p1', 'trash', V.c3),
    ]);
    while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
    expect(trash(g, 'p1')).toEqual([V.c4]);
    expect(g.zone('p1', 'deck')).toHaveLength(4);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(V.c7); // the three went to the bottom
    expectDecision(g, 'choose', 'p2'); // the opponent chooses the card they trash
    pick(g, [g.find('p2', 'hand', V.c1)]);
    expect(hand(g, 'p2')).toHaveLength(4);
    expect(trash(g, 'p2')).toEqual([V.c1]);
  });

  it('the opponent with exactly 4 cards in hand trashes nothing (boundary), though the cost is paid', () => {
    const g = attacking(times(4, V.c1));
    accept(g);
    pick(g, [
      g.find('p1', 'trash', V.c1),
      g.find('p1', 'trash', V.c2),
      g.find('p1', 'trash', V.c3),
    ]);
    while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
    expect(trash(g, 'p1')).toEqual([V.c4]);
    expect(hand(g, 'p2')).toHaveLength(4);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('declining the cost does nothing; with fewer than 3 cards in the trash it is not offered', () => {
    const g = attacking(times(6, V.c1));
    decline(g);
    expect(trash(g, 'p1')).toEqual(TRASH);
    expect(hand(g, 'p2')).toHaveLength(6);
    const h = attacking(times(6, V.c1), [V.c1, V.c2]);
    expect(dec(h)?.kind).not.toBe('optional');
    expect(trash(h, 'p1')).toEqual([V.c1, V.c2]);
  });

  it("once per turn it is not K.O.'d by an opponent's effect: the first is prevented, the second is not", () => {
    const g = start({ characters: [ID, V.c1] }, { characters: [V.c2] });
    koByEffect(g, 'p1', ID);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID, V.c1]);
    expect(dec(g)?.kind).toBe('main');
    koByEffect(g, 'p1', ID);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([V.c1]);
  });

  it("the protection covers only the opponent's effects: your own K.O. effect works, and it renews next turn", () => {
    const own = start({ characters: [ID] });
    own.state = applyOp(own.state, {
      op: 'ko',
      card: own.find('p1', 'characters', ID),
      by: 'p1',
    }).state;
    expect(cardsOf(own, 'p1', 'characters')).toEqual([]);

    const g = start({ characters: [ID], leader: SN_LEADER }, { characters: [V.c2] });
    koByEffect(g, 'p1', ID); // prevented, spent
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    koByEffect(g, 'p1', ID); // a new turn: prevented again
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
  });
});
