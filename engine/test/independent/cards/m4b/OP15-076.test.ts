/**
 * OP15-076 Lightning Beast Kiten (Event, Purple, cost 0, {Sky Island}).
 *
 * Card text:
 *   "[Main] DON!! −1: If your Leader is [Enel], draw 1 card. Then, give up to 1 of your
 *    opponent's Characters −1000 power during this turn.
 *    [Counter] Up to 1 of your [Enel] cards gains +2000 power during this battle."
 *
 * Rules: CR 4-10-1 / 4-10-2 (a "then" after a failed "if" does not resolve; ambiguity noted:
 * the "if" may be read as covering only the draw, CR 4-10-2 settles it); CR 8-3-1-6 / 8-3-1-4;
 * CR 8-4-4-1; CR 6-6-1-3.
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from '../../helpers.ts';
import { donOf, kind, myTurn } from '../kit.ts';
import {
  C,
  drive,
  enelCounterSuite,
  FILLER,
  offeredCards,
  playCard,
  side,
  sorted,
  V,
} from './kit-c.ts';

const ID = 'OP15-076';

function game(leader: string = C.enel) {
  return myTurn(
    side(leader, FILLER, {
      hand: [ID],
      characters: [V.sai],
      costArea: { active: 2, rested: 0 },
      ...(leader === C.enel ? { donDeck: 4 } : {}),
    }),
    side(C.luffy, FILLER, { characters: [V.kingdew, V.sunny] }),
  );
}

describe('OP15-076 Lightning Beast Kiten: [Main] DON!! −1 → (Enel) draw 1, then opponent Character −1000', () => {
  it('Enel Leader: returns 1 DON!!, draws 1, the chosen opponent Character is 7000 − 1000', () => {
    const g = game();
    const t = g.find('p2', 'characters', V.kingdew);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [t], don: 'costActive' });
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(g.power(t)).toBe(6000);
    expect(donOf(g, 'p1').deck).toBe(5);
  });

  it('only opponent Characters are offered (not the opponent Leader, not mine)', () => {
    const g = game();
    playCard(g, 'p1', ID);
    for (let i = 0; i < 6 && !(kind(g) === 'choose' && offeredCards(g).includes(V.kingdew)); i++) {
      if (kind(g) === 'optional') g.act({ type: 'optional', accept: true });
      else if (kind(g) === 'choose') g.act(g.legal().find((a) => a.type === 'pick')!);
      else break;
    }
    expect(offeredCards(g)).toEqual(sorted([V.kingdew, V.sunny]));
  });

  it('"up to 1": may choose nobody; the draw still happens', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [], don: 'costActive' });
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(g.power(g.find('p2', 'characters', V.kingdew))).toBe(7000);
  });

  it('non-Enel Leader: DON!! −1 is paid, but no card is drawn and (CR 4-10-2) no −1000 is given', () => {
    const g = game(C.shanks);
    const t = g.find('p2', 'characters', V.kingdew);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [t], don: 'costActive' });
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.power(t)).toBe(7000);
    expect(donOf(g, 'p1').deck).toBe(9);
  });

  it('CR 8-3-1-4: declining DON!! −1 does nothing', () => {
    const g = game();
    const t = g.find('p2', 'characters', V.kingdew);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false, targets: [t] });
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.power(t)).toBe(7000);
  });

  it('"during this turn": the −1000 is gone on the opponent\'s turn', () => {
    const g = game();
    const t = g.find('p2', 'characters', V.kingdew);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [t], don: 'costActive' });
    expect(g.power(t)).toBe(6000);
    endTurn(g);
    expect(g.power(t)).toBe(7000);
  });
});

describe('OP15-076 Kiten: the condition looks at the Leader', () => {
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
    expect(g.power(g.find('p2', 'characters', V.kingdew))).toBe(7000);
  });
});

enelCounterSuite(ID);
