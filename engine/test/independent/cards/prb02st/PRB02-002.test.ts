/**
 * PRB02-002 Trafalgar Law (Character, cost 6, 7000, Counter +1000, {Heart Pirates}/{The Seven
 * Warlords of the Sea}/{Punk Hazard}).
 *
 * Card text: "[Once Per Turn] If this Character would be removed from the field by your opponent's
 * effect, you may give this Character -2000 power during this turn instead. [When Attacking] Give
 * up to 1 of your opponent's Characters -2000 power during this turn."
 *
 * Rules: a replacement effect (CR 8-1-3-4) applies only to removal by an effect of the opponent
 * ("by your opponent's effect"), not to a K.O. in battle; it is optional ("you may"), and declining
 * lets the removal happen. Once Per Turn limits it to one use per turn (CR 8-3-?). "Up to 1" may
 * be answered with nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  accept,
  at,
  attack,
  chr,
  decline,
  endTurn,
  kind,
  LDP,
  mine,
  need,
  none,
  noDefence,
  offeredIds,
  opponentKingdomCome,
  opponentKOs,
  playRaw,
  pickInst,
  SP,
  sorted,
  takeMost,
  theirs,
  decision,
} from './kit-prb02sta.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const LAW = 'PRB02-002';

/** p2's turn, p2 holds the given Events and 10 active DON!!, p1 has Law (7000) on the field. */
function theirBoard(
  p2hand: string[],
  p1chars: (string | { card: string; rested?: boolean })[] = [LAW],
) {
  return theirs(
    LDP.neutral,
    { characters: p1chars },
    { hand: p2hand, costArea: { active: 10, rested: 0 } },
  );
}

/** Finish an Event's trailing p2 questions (Lightning's "add up to 1 DON!!" count). */
function settleP2(g: TestGame) {
  for (let i = 0; i < 3; i++) {
    const d = decision(g);
    if (d?.kind === 'choose' && d.player === 'p2') takeMost(g);
    else return;
  }
}

describe("PRB02-002 Trafalgar Law: replacement -2000 instead of removal by the opponent's effect; [When Attacking] -2000", () => {
  it('printed values: cost 6, 7000 power, Counter +1000', () => {
    const g = mine(LDP.neutral, { characters: [LAW] });
    const c = g.card(at(g, 'p1', 'characters', LAW));
    expect([c.cost, c.power, c.counter]).toEqual([6, 7000, 1000]);
  });

  it("K.O. by the opponent's effect: the replacement is offered as a question to the controller", () => {
    const g = theirBoard([SP.kingdomCome]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', LAW));
    const d = need(g, 'optional', 'p1');
    expect(d.purpose).toBe('replacement');
  });

  it('accepting: Law stays on the field with -2000 power (5000) and is not K.O.d', () => {
    const g = theirBoard([SP.kingdomCome]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', LAW));
    accept(g);
    expect(sorted(g, 'p1', 'characters')).toEqual([LAW]);
    expect(sorted(g, 'p1', 'trash')).toEqual([]);
    expect(g.power(at(g, 'p1', 'characters', LAW))).toBe(5000);
  });

  it('declining ("you may"): Law is K.O.d as usual and keeps 7000 until then', () => {
    const g = theirBoard([SP.kingdomCome]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', LAW));
    decline(g);
    expect(sorted(g, 'p1', 'characters')).toEqual([]);
    expect(sorted(g, 'p1', 'trash')).toEqual([LAW]);
  });

  it('[Once Per Turn]: after one use, a second removal in the same turn is not replaced (Law at 5000 is K.O.d by Lightning, no question)', () => {
    const g = theirBoard([SP.kingdomCome, SP.lightning]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', LAW));
    accept(g);
    settleP2(g);
    need(g, 'main', 'p2');
    expect(g.power(at(g, 'p1', 'characters', LAW))).toBe(5000);
    opponentKOs(g, at(g, 'p1', 'characters', LAW));
    expect(kind(g)).not.toBe('optional');
    settleP2(g);
    expect(sorted(g, 'p1', 'trash')).toEqual([LAW]);
  });

  it('declining does not spend anything lasting: Law is simply K.O.d (no second question afterwards)', () => {
    const g = theirBoard([SP.kingdomCome]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', LAW));
    decline(g);
    settleP2(g);
    expect(kind(g)).toBe('main');
  });

  it('the -2000 lasts this turn only: Law is back to 7000 on my next turn', () => {
    const g = theirBoard([SP.kingdomCome]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', LAW));
    accept(g);
    settleP2(g);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.power(at(g, 'p1', 'characters', LAW))).toBe(7000);
  });

  it('[Once Per Turn] is available again on the next opponent turn', () => {
    const g = theirBoard([SP.kingdomCome, SP.kingdomCome]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', LAW));
    accept(g);
    settleP2(g);
    endTurn(g);
    endTurn(g);
    need(g, 'main', 'p2');
    opponentKingdomCome(g, at(g, 'p1', 'characters', LAW));
    expect(need(g, 'optional', 'p1').purpose).toBe('replacement');
  });

  it('a K.O. in battle is not an effect: no question, Law is K.O.d', () => {
    const g = theirs(
      LDP.neutral,
      { characters: [{ card: LAW, rested: true }] },
      { characters: [SP.c6p8] },
    );
    attack(g, at(g, 'p2', 'characters', SP.c6p8), at(g, 'p1', 'characters', LAW));
    noDefence(g);
    expect(sorted(g, 'p1', 'trash')).toEqual([LAW]);
    need(g, 'main', 'p2');
  });

  it("a bounce by the opponent's effect is also a removal from the field: the replacement is offered, accepting keeps Law", () => {
    const g = theirBoard([SP.bounce7]);
    playRaw(g, SP.bounce7);
    pickInst(g, [at(g, 'p1', 'characters', LAW)]);
    expect(need(g, 'optional', 'p1').purpose).toBe('replacement');
    accept(g);
    expect(sorted(g, 'p1', 'characters')).toEqual([LAW]);
    expect(sorted(g, 'p1', 'hand')).toEqual([]);
  });

  it('[When Attacking] offers only opposing Characters; -2000 on the chosen one (5000 -> 3000)', () => {
    const g = mine(LDP.neutral, { characters: [LAW] }, { characters: [SP.c3p5, SP.c4p6] });
    attack(g, at(g, 'p1', 'characters', LAW), g.leader('p2'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.c3p5, SP.c4p6].sort());
    pickInst(g, [chr(g, 'p2', SP.c3p5)]);
    expect(g.power(chr(g, 'p2', SP.c3p5))).toBe(3000);
    expect(g.power(chr(g, 'p2', SP.c4p6))).toBe(6000);
    expect(kind(g)).toBe('block');
  });

  it('[When Attacking] "up to 1": choosing nothing changes no power', () => {
    const g = mine(LDP.neutral, { characters: [LAW] }, { characters: [SP.c3p5] });
    attack(g, at(g, 'p1', 'characters', LAW), g.leader('p2'));
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(chr(g, 'p2', SP.c3p5))).toBe(5000);
    expect(kind(g)).toBe('block');
  });

  it('[When Attacking] with no opposing Character: nothing to choose, the attack goes on', () => {
    const g = mine(LDP.neutral, { characters: [LAW] });
    attack(g, at(g, 'p1', 'characters', LAW), g.leader('p2'));
    if (kind(g) === 'choose') none(g);
    expect(kind(g)).toBe('block');
  });

  it('[When Attacking] -2000 can make an opposing Character weaker than Law in the same battle (attack a rested 8000 Character after -2000: 6000 < 7000)', () => {
    const g = mine(
      LDP.neutral,
      { characters: [LAW] },
      { characters: [{ card: SP.c6p8, rested: true }] },
    );
    attack(g, at(g, 'p1', 'characters', LAW), chr(g, 'p2', SP.c6p8));
    pickInst(g, [chr(g, 'p2', SP.c6p8)]);
    expect(g.power(chr(g, 'p2', SP.c6p8))).toBe(6000);
    noDefence(g);
    expect(sorted(g, 'p2', 'trash')).toEqual([SP.c6p8]);
  });
});
