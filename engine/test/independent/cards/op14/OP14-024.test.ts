/**
 * OP14-024 Kin'emon (Character, cost 4, 5000, Counter +1000, {Land of Wano}/{The Akazaya Nine}).
 *
 * Card text: "[On Play] Set up to 3 of your DON!! cards as active. Then, you cannot play Character
 * cards during this turn.
 * [On K.O.] Rest up to 1 of your opponent's cards."
 *
 * Rules: setting DON!! as active (CR 6-2-4 states) takes rested DON!! from the cost area; "up to"
 * allows fewer, and the answer helper accepts a count question or none (taking the most is always
 * the natural choice). "Then" is not gated by the DON!! being set: the restriction applies even
 * when no DON!! could be set. "You cannot play Character cards during this turn" stops Characters
 * only; a Stage or Event can still be played. [On K.O.] (CR 10-2-17): K.O. in battle counts.
 * "Rest up to 1 of your opponent's cards" may be none; the candidates include Characters.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  canPlayCard,
  chr,
  donOf,
  endTurn,
  kind,
  LD14,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickInst,
  playRaw,
  S14,
  takeMost,
  theirs,
} from './kit-op14a.ts';

const KIN = 'OP14-024';

/** p1's Main Phase: Kin'emon in hand, `active`/`rested` DON!!, `hand` besides Kin'emon. */
function playKin(active: number, rested: number, hand: string[] = []) {
  const g = mine(LD14.luffy, { hand: [KIN, ...hand], costArea: { active, rested } });
  playRaw(g, KIN);
  takeMost(g);
  return g;
}

describe("OP14-024 Kin'emon: [On Play] set up to 3 DON!! active, then no more Characters this turn", () => {
  it('printed values: cost 4, 5000, Counter +1000', () => {
    const g = mine(LD14.luffy, { hand: [KIN] });
    const c = g.card(g.find('p1', 'hand', KIN));
    expect(c.cost).toBe(4);
    expect(c.power).toBe(5000);
    expect(c.counter).toBe(1000);
  });

  it('sets 3 rested DON!! active (after paying the cost of 4: 4 rested + 3 set = 3 active, 4 rested)', () => {
    const g = playKin(4, 3);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 4 });
  });

  // Disagreement A-1 (severity 1, unsettled): "Add up to N DON!!" asks a count (E-Q11); by analogy
  // "Set up to 3 of your DON!! cards as active" is an "up to" choice of the player. The engine sets
  // the maximum without asking.
  it.fails(
    '"up to 3": the player is asked how many DON!! to set (a count question, as for adding DON!!)',
    () => {
      const g = mine(LD14.luffy, { hand: [KIN], costArea: { active: 4, rested: 3 } });
      playRaw(g, KIN);
      const d = need(g, 'choose', 'p1');
      expect(d.purpose).toBe('mode');
    },
  );

  it('"up to 3": with 5 DON!! rested after the cost, only 3 are set', () => {
    const g = playKin(5, 4);
    // Paid 4 of 5 active: 1 active + 8 rested; set 3: 4 active, 5 rested.
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 5 });
  });

  it('with only 1 rested DON!! to set, sets that one', () => {
    const g = playKin(4, 0);
    // Cost rests all 4: 0 active, 4 rested -> set 3.
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 1 });
    const h = playKin(5, 0);
    expect(donOf(h, 'p1')).toMatchObject({ active: 4, rested: 1 });
  });

  it('afterwards I cannot play Character cards this turn (Marco in hand is not playable)', () => {
    const g = playKin(4, 3, [S14.marco]);
    expect(kind(g)).toBe('main');
    expect(canPlayCard(g, g.find('p1', 'hand', S14.marco))).toBe(false);
  });

  it('the restriction stops Characters only: a Stage can still be played', () => {
    const g = playKin(4, 3, [S14.stage, S14.marco]);
    expect(canPlayCard(g, g.find('p1', 'hand', S14.stage))).toBe(true);
    expect(canPlayCard(g, g.find('p1', 'hand', S14.marco))).toBe(false);
  });

  it('"Then" is not gated by the DON!!: with no DON!! to set the restriction still applies', () => {
    const g = playKin(4, 0, [S14.marco]);
    expect(canPlayCard(g, g.find('p1', 'hand', S14.marco))).toBe(false);
  });

  it('the restriction lasts this turn only: Characters can be played on my next turn', () => {
    const g = playKin(4, 3, [S14.marco]);
    endTurn(g);
    need(g, 'main', 'p2');
    endTurn(g);
    need(g, 'main', 'p1');
    expect(canPlayCard(g, g.find('p1', 'hand', S14.marco))).toBe(true);
  });
});

function ko(extra: string[] = [S14.kingdew]) {
  const g = theirs(
    LD14.croc,
    { characters: [{ card: KIN, rested: true }, S14.marco] },
    { characters: [S14.thatch, ...extra] },
  );
  attack(g, at(g, 'p2', 'characters', S14.thatch), at(g, 'p1', 'characters', KIN));
  passBlock(g);
  passCounter(g);
  return g;
}

describe("OP14-024 Kin'emon: [On K.O.] rest up to 1 of the opponent's cards", () => {
  it("K.O. in battle: offers the opponent's Characters (not my own) and rests the chosen one", () => {
    const g = ko();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(S14.kingdew);
    expect(offeredIds(g)).not.toContain(S14.marco);
    pickInst(g, [chr(g, 'p2', S14.kingdew)]);
    expect(g.card(chr(g, 'p2', S14.kingdew)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', S14.thatch)).rested).toBe(true);
  });

  it('"up to 1": may rest nothing', () => {
    const g = ko();
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(chr(g, 'p2', S14.kingdew)).rested).toBe(false);
  });

  it('rests only one card', () => {
    const g = ko([S14.kingdew, S14.sai]);
    pickInst(g, [chr(g, 'p2', S14.kingdew)]);
    expect(g.card(chr(g, 'p2', S14.sai)).rested).toBe(false);
  });
});
