/**
 * Timing of the group-B Events: an Event can be used only in the timing its text names.
 * A card with only a [Counter] cannot be played in the Main Phase; a card with only a [Main]
 * cannot be used in the Counter Step (CR 7-1-3-1-2, 10-2-4-1, 10-2-3-1); cards with both can be used
 * in either. Every other test of these Events is in the per-card file.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  canCounter,
  CH,
  EV,
  F,
  isLegal,
  LB,
  myTurn,
  passBlock,
  side,
  theirTurn,
} from './kit-b.ts';

const COUNTER_ONLY = [EV.kick, EV.haki, EV.gaha, EV.charlestone];
const MAIN_ONLY = [EV.luna, EV.giantPistol, EV.samurai, EV.mole, EV.plan];
const BOTH = [EV.meteor, EV.asura, EV.allOut, EV.rashomon];

function mainPhase(event: string) {
  const g = myTurn(
    side(LB.redShc, F.red, {
      hand: [event, CH.sunny],
      costArea: { active: 10, rested: 0 },
      characters: [CH.robin],
      life: [CH.sunny, CH.sunny, CH.sunny, CH.sunny],
    }),
    side(LB.opp, F.red, { characters: [CH.kingdew] }),
  );
  return { g, card: g.find('p1', 'hand', event) };
}

function counterStep(event: string) {
  const g = theirTurn(
    side(LB.redShc, F.red, {
      hand: [event, CH.sunny],
      costArea: { active: 10, rested: 0 },
      characters: [CH.robin],
      life: [CH.sunny, CH.sunny, CH.sunny, CH.sunny],
    }),
    side(LB.opp, F.red, { characters: [CH.kingdew] }),
  );
  act(g, {
    type: 'attack',
    attacker: g.find('p2', 'characters', CH.kingdew),
    target: g.leader('p1'),
  });
  passBlock(g);
  return { g, card: g.find('p1', 'hand', event) };
}

describe('Events with only a [Counter] (OP04-016, OP12-018, OP17-017, OP05-038)', () => {
  for (const e of COUNTER_ONLY) {
    it(`${e} cannot be played in the Main Phase`, () => {
      const { g, card } = mainPhase(e);
      expect(isLegal(g, { type: 'playCard', card })).toBe(false);
    });
    it(`${e} can be used in the Counter Step`, () => {
      const { g, card } = counterStep(e);
      expect(canCounter(g, card)).toBe(true);
    });
  }
});

describe('Events with only a [Main] (OP08-036, EB02-021, OP01-055, ST21-017, OP14-019)', () => {
  for (const e of MAIN_ONLY) {
    it(`${e} can be played in the Main Phase`, () => {
      const { g, card } = mainPhase(e);
      expect(isLegal(g, { type: 'playCard', card })).toBe(true);
    });
    it(`${e} cannot be used in the Counter Step`, () => {
      const { g, card } = counterStep(e);
      expect(canCounter(g, card)).toBe(false);
    });
  }
});

describe('Events with [Main] and [Counter] (OP06-017, OP12-037, OP13-040, OP12-038)', () => {
  for (const e of BOTH) {
    it(`${e} can be used in either timing`, () => {
      const m = mainPhase(e);
      expect(isLegal(m.g, { type: 'playCard', card: m.card })).toBe(true);
      const c = counterStep(e);
      expect(canCounter(c.g, c.card)).toBe(true);
    });
  }
});
