/**
 * OP15-074 Varie (Event, Purple, cost 0, {Sky Island}).
 *
 * Card text:
 *   "[Main] DON!! −1: If your Leader is [Enel], draw 1 card. Then, up to 1 of your Characters
 *    gains +2 cost until the end of your opponent's next End Phase.
 *    [Counter] Up to 1 of your [Enel] cards gains +2000 power during this battle."
 *
 * Rules: CR 4-10-1 / 4-10-2 (when an "if" fails, the clause after "Then" cannot resolve either);
 * CR 8-3-1-6; CR 8-3-1-4; CR 8-4-4-1; CR 6-6-1-2 ("until the end of … End Phase" ends with that
 * End Phase). Ambiguity: whether the cost boost sits inside the "If your Leader is [Enel]"
 * condition. CR 4-10-2 says a "then" after a failed "if" does not resolve, so it does not.
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from '../../helpers.ts';
import { donOf, kind, myTurn } from '../kit.ts';
import {
  C,
  drive,
  enelCounterSuite,
  FILLER,
  ids,
  offeredCards,
  playCard,
  side,
  sorted,
  V,
} from './kit-c.ts';

const ID = 'OP15-074';

function game(leader: string = C.enel, p1: Parameters<typeof side>[2] = {}) {
  const donDeck = leader === C.enel ? 4 : undefined;
  return myTurn(
    side(leader, FILLER, {
      hand: [ID],
      characters: [V.sai, V.marco],
      costArea: { active: 2, rested: 0 },
      ...(donDeck !== undefined ? { donDeck } : {}),
      ...p1,
    }),
    side(C.luffy, FILLER, { characters: [V.kingdew] }),
  );
}

describe('OP15-074 Varie: [Main] DON!! −1 → (Enel) draw 1, then +2 cost on a Character', () => {
  it('Enel Leader: returns 1 DON!!, draws 1 and the chosen Character is cost 2 + 2', () => {
    const g = game();
    const sai = g.find('p1', 'characters', V.sai);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [sai], don: 'costActive' });
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(g.card(sai).cost).toBe(4);
    expect(g.card(g.find('p1', 'characters', V.marco)).cost).toBe(3);
    expect(donOf(g, 'p1').deck).toBe(5);
    expect(ids(g, 'p1', 'trash')).toContain(ID);
  });

  it('non-Enel Leader: DON!! −1 is paid but nothing is drawn, and (CR 4-10-2) no cost boost either', () => {
    const g = game(C.shanks);
    const sai = g.find('p1', 'characters', V.sai);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [sai], don: 'costActive' });
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.card(sai).cost).toBe(2);
  });

  it('only my own Characters are offered for the cost boost', () => {
    const g = game();
    playCard(g, 'p1', ID);
    while (kind(g) === 'optional') drive(g, 'p1', {}, 1);
    for (let i = 0; i < 2 && kind(g) === 'choose' && offeredCards(g).length === 0; i++) {
      g.act(g.legal().find((a) => a.type === 'pick')!);
    }
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual(sorted([V.sai, V.marco]));
  });

  it('"up to 1": may choose no Character; the draw still happens', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [], don: 'costActive' });
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(g.card(g.find('p1', 'characters', V.sai)).cost).toBe(2);
  });

  it('only 1 Character gets the boost', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', {
      targets: [g.find('p1', 'characters', V.sai), g.find('p1', 'characters', V.marco)],
      don: 'costActive',
    });
    const total =
      g.card(g.find('p1', 'characters', V.sai)).cost! +
      g.card(g.find('p1', 'characters', V.marco)).cost!;
    expect(total).toBe(7);
  });

  it("the boost lasts through the opponent's turn and ends at the end of their End Phase", () => {
    const g = game();
    const sai = g.find('p1', 'characters', V.sai);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [sai], don: 'costActive' });
    expect(g.card(sai).cost).toBe(4);
    endTurn(g); // now the opponent's turn
    expect(g.card(sai).cost).toBe(4);
    endTurn(g); // opponent's End Phase passes, back to me
    expect(g.card(sai).cost).toBe(2);
  });

  it('CR 8-3-1-4: declining DON!! −1 does nothing (no draw, no boost, DON!! kept)', () => {
    const g = game();
    const sai = g.find('p1', 'characters', V.sai);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false, targets: [sai] });
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.card(sai).cost).toBe(2);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, deck: 4 });
  });
});

describe('OP15-074 Varie: the condition looks at the Leader', () => {
  it('only the LEADER matters: a non-Enel Leader with an [Enel] Character on the field does not satisfy the "if"', () => {
    const g = myTurn(
      side(C.shanks, FILLER, {
        hand: [ID],
        characters: [C.enelChar, V.sai],
        costArea: { active: 2, rested: 0 },
      }),
      side(C.luffy, FILLER, { characters: [V.kingdew] }),
    );
    playCard(g, 'p1', ID);
    drive(g, 'p1', {
      targets: [g.find('p1', 'characters', V.sai), g.find('p2', 'characters', V.kingdew)],
      don: 'costActive',
    });
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.card(g.find('p1', 'characters', V.sai)).cost).toBe(2);
  });
});

enelCounterSuite(ID);
