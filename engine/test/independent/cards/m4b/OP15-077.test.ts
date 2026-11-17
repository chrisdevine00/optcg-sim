/**
 * OP15-077 Lightning Dragon (Event, Purple, cost 0, {Sky Island}).
 *
 * Card text:
 *   "[Main] DON!! −1: Draw 1 card. Then, up to 1 of your opponent's rested Characters with 6000
 *    power or less will not become active in your opponent's next Refresh Phase."
 *
 * Rules: CR 6-2 (Refresh Phase sets rested cards active); CR 8-3-1-6 / 8-3-1-4; CR 8-4-4-1;
 * no Enel condition on this card; the effect covers only the opponent's NEXT Refresh Phase.
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from '../../helpers.ts';
import { donOf, kind, myTurn } from '../kit.ts';
import { C, drive, FILLER, offeredCards, playCard, side, sorted, V } from './kit-c.ts';

const ID = 'OP15-077';

function game() {
  return myTurn(
    side(C.shanks, FILLER, { hand: [ID], costArea: { active: 2, rested: 0 } }),
    side(C.luffy, FILLER, {
      characters: [
        { card: V.hajrudin, rested: true }, // 6000, rested: eligible
        { card: V.kingdew, rested: true }, // 7000, rested: too strong
        { card: V.sai, rested: true }, // 4000, rested: eligible
        { card: V.sunny, rested: false }, // 3000, active: not eligible
      ],
    }),
  );
}

describe('OP15-077 Lightning Dragon: [Main] DON!! −1 → draw 1, a rested opponent Character stays rested', () => {
  it("happy path: draws 1, and the chosen rested 6000 Character stays rested through the opponent's Refresh Phase while others become active", () => {
    const g = game();
    const haj = g.find('p2', 'characters', V.hajrudin);
    const sai = g.find('p2', 'characters', V.sai);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [haj], don: 'costActive' });
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(donOf(g, 'p1').deck).toBe(9);
    endTurn(g); // opponent's turn: Refresh Phase happened
    expect(g.card(haj).rested).toBe(true);
    expect(g.card(sai).rested).toBe(false);
    expect(g.card(g.find('p2', 'characters', V.kingdew)).rested).toBe(false);
  });

  it('only RESTED opponent Characters with 6000 power or less are offered (boundary 6000 yes; 7000 and active ones no)', () => {
    const g = game();
    playCard(g, 'p1', ID);
    for (let i = 0; i < 6 && !(kind(g) === 'choose' && offeredCards(g).includes(V.hajrudin)); i++) {
      if (kind(g) === 'optional') g.act({ type: 'optional', accept: true });
      else if (kind(g) === 'choose') g.act(g.legal().find((a) => a.type === 'pick')!);
      else break;
    }
    expect(offeredCards(g)).toEqual(sorted([V.hajrudin, V.sai]));
  });

  it('"up to 1": choosing nobody lets everything refresh', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [], don: 'costActive' });
    endTurn(g);
    expect(g.card(g.find('p2', 'characters', V.hajrudin)).rested).toBe(false);
    expect(g.card(g.find('p2', 'characters', V.sai)).rested).toBe(false);
  });

  it('only one Character is held down even if two qualify', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', {
      targets: [g.find('p2', 'characters', V.hajrudin), g.find('p2', 'characters', V.sai)],
      don: 'costActive',
    });
    endTurn(g);
    const rested = g.zone('p2', 'characters').filter((c) => c.rested);
    // The 7000 Kingdew is not affected, so exactly one of the two chosen candidates stays rested.
    expect(rested).toHaveLength(1);
  });

  it("only the NEXT Refresh Phase: the Character refreshes on the opponent's following turn", () => {
    const g = game();
    const haj = g.find('p2', 'characters', V.hajrudin);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [haj], don: 'costActive' });
    endTurn(g); // opponent's turn 4: stays rested
    expect(g.card(haj).rested).toBe(true);
    endTurn(g); // my turn 5
    endTurn(g); // opponent's turn 6: Refresh Phase again
    expect(g.card(haj).rested).toBe(false);
  });

  it('CR 8-3-1-4: declining DON!! −1 does nothing: no draw and the Character refreshes', () => {
    const g = game();
    const haj = g.find('p2', 'characters', V.hajrudin);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false, targets: [haj] });
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    endTurn(g);
    expect(g.card(haj).rested).toBe(false);
  });

  it('works with any Leader (no [Enel] condition): the draw happens with a non-Enel Leader', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [], don: 'costActive' });
    expect(g.zone('p1', 'hand')).toHaveLength(1);
  });
});
