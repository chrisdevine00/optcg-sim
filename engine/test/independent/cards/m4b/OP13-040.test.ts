/**
 * OP13-040 I Know You're Strong... So I'll Go All Out from the Very Start!!! (Event, Green, cost 1;
 * Straw Hat Crew / Supernovas).
 *
 * Card text (cards/data):
 *   "[Main] You may rest 2 of your DON!! cards: Up to 2 of your opponent's rested Characters with a
 *    cost of 7 or less will not become active in your opponent's next Refresh Phase.
 *    [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: the Refresh Phase sets rested cards active (CR 6-2-4); the effect skips exactly the next
 * one for the chosen Characters (the one right after this turn), and the chosen Characters become
 * active in the Refresh after that. Candidates are rested Characters only, cost 7 or less.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  CH,
  choiceCards,
  counterEvent,
  donOf,
  endTurn,
  EV,
  F,
  LB,
  mainEvent,
  myTurn,
  passBlock,
  side,
  takeDamage,
  theirTurn,
} from './kit-b.ts';

function mainGame(p2: Partial<PlayerSpec> = {}, p1: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LB.greenKid, F.green, {
      hand: [EV.allOut],
      costArea: { active: 3, rested: 0 },
      ...p1,
    }),
    side(LB.opp, F.red, {
      characters: [
        { card: CH.kingdew, rested: true }, // cost 5
        { card: CH.thatch, rested: true }, // cost 6
        { card: CH.accino8, rested: true }, // cost 8
        CH.marco, // cost 3, active
      ],
      ...p2,
    }),
  );
}

const rested = (g: ReturnType<typeof mainGame>, c: string) =>
  g.card(g.find('p2', 'characters', c)).rested;

describe('OP13-040 [Main]: rest 2 DON!!: up to 2 rested Characters (cost ≤7) skip the next Refresh', () => {
  it('candidates: only rested Characters with cost 7 or less (Kingdew 5, Thatch 6); not the cost-8 one, not the active one', () => {
    const g = mainGame();
    act(g, { type: 'playCard', card: g.find('p1', 'hand', EV.allOut) });
    act(g, { type: 'optional', accept: true });
    expect(choiceCards(g)).toEqual([CH.kingdew, CH.thatch].sort());
  });

  it('happy path: both chosen stay rested through the opponent’s next Refresh; the cost-8 one becomes active; the active one stays active', () => {
    const g = mainGame();
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    const thatch = g.find('p2', 'characters', CH.thatch);
    mainEvent(g, g.find('p1', 'hand', EV.allOut), { picks: [[kingdew, thatch]] });
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
    endTurn(g); // p2's turn 4: its Refresh Phase has run
    expect(rested(g, CH.kingdew)).toBe(true);
    expect(rested(g, CH.thatch)).toBe(true);
    expect(rested(g, CH.accino8)).toBe(false);
    expect(rested(g, CH.marco)).toBe(false);
  });

  it('only the NEXT Refresh is skipped: they become active in the one after', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.allOut), {
      picks: [[g.find('p2', 'characters', CH.kingdew)]],
    });
    endTurn(g); // p2 turn 4
    endTurn(g); // p1 turn 5
    endTurn(g); // p2 turn 6: Refresh
    expect(rested(g, CH.kingdew)).toBe(false);
  });

  it('control: without the Event all rested Characters become active at the next Refresh', () => {
    const g = mainGame();
    endTurn(g);
    expect(rested(g, CH.kingdew)).toBe(false);
    expect(rested(g, CH.thatch)).toBe(false);
    expect(rested(g, CH.accino8)).toBe(false);
  });

  it('"up to 2": choosing only 1 leaves the other rested Character to become active normally', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.allOut), {
      picks: [[g.find('p2', 'characters', CH.thatch)]],
    });
    endTurn(g);
    expect(rested(g, CH.thatch)).toBe(true);
    expect(rested(g, CH.kingdew)).toBe(false);
  });

  it('"up to 2": choosing nothing (cost paid) changes nothing', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.allOut), { picks: [[]] });
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
    endTurn(g);
    expect(rested(g, CH.kingdew)).toBe(false);
  });

  it('boundary: a rested cost-7 Character (OP17-035) is a candidate, a cost-8 Character (P-061) is not', () => {
    const g = mainGame({
      characters: [
        { card: CH.zoroG7, rested: true },
        { card: CH.luffyG8, rested: true },
      ],
    });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', EV.allOut) });
    act(g, { type: 'optional', accept: true });
    expect(choiceCards(g)).toEqual([CH.zoroG7]);
  });

  it('CR 8-3-1-4: declining the rest-2 cost does nothing: all rested Characters untap normally', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.allOut), { use: [false] });
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
    endTurn(g);
    expect(rested(g, CH.kingdew)).toBe(false);
    expect(rested(g, CH.thatch)).toBe(false);
  });

  it('the opponent’s DON!! and Leader refresh as usual', () => {
    const g = mainGame({ costArea: { active: 0, rested: 3 } });
    mainEvent(g, g.find('p1', 'hand', EV.allOut), {
      picks: [[g.find('p2', 'characters', CH.kingdew)]],
    });
    endTurn(g);
    expect(donOf(g, 'p2').rested).toBe(0);
  });
});

describe('OP13-040 [Counter]: your Leader gains +3000 during this battle', () => {
  it('Leader 5000 → 8000 stops a 7000 attacker, then returns to 5000', () => {
    const g = theirTurn(
      side(LB.greenKid, F.green, { hand: [EV.allOut], costArea: { active: 1, rested: 0 } }),
      side(LB.opp, F.red, { characters: [CH.kingdew] }),
    );
    act(g, {
      type: 'attack',
      attacker: g.find('p2', 'characters', CH.kingdew),
      target: g.leader('p1'),
    });
    passBlock(g);
    counterEvent(g, g.find('p1', 'hand', EV.allOut));
    expect(g.power(g.leader('p1'))).toBe(8000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
