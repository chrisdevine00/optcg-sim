/**
 * OP16-017 LittleOars Jr. (Character, Red, cost 4, 8000, Counter +1000, {Giant}/{Whitebeard Pirates
 * Allies}, Strike, [Blocker]).
 *
 * Card text: "If you have no Characters with a type including "Whitebeard Pirates" and a cost of 8 or
 * more give this Character -4000 power. [Blocker]"
 *
 * Rules: CR 8-1-3-3 (permanent effect, re-evaluated continuously), "a type including" counts
 * {Whitebeard Pirates Allies}, the condition counts only my own Characters, CR 10-1-3 ([Blocker]).
 * Scenery: OP16-005 Thatch (Red, cost 8, 8000, {Whitebeard Pirates}, [Blocker]; its only other text
 * is a hand-cost reduction).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  blockers,
  attack,
  kw,
  mine,
  OL,
  OV,
  playCard,
  pw,
  theirs,
  charIds,
} from './kit-op16a.ts';

const OARS = 'OP16-017';
const WB8 = 'OP16-005'; // cost 8, 8000, {Whitebeard Pirates}
const power = (chars: string[], p2chars: string[] = []) => {
  const g = mine(OL.luffy, { characters: [OARS, ...chars] }, { characters: p2chars });
  return pw(g, 'p1', OARS);
};

describe('OP16-017 LittleOars Jr.: -4000 power unless I have a Whitebeard Pirates Character with cost 8+', () => {
  it('alone it is 4000 (8000 - 4000)', () => {
    expect(power([])).toBe(4000);
  });

  it('with a {Whitebeard Pirates} Character with cost exactly 8 it is 8000', () => {
    expect(power([WB8])).toBe(8000);
  });

  it('boundary: a {Whitebeard Pirates} Character with cost 7 does not remove the penalty', () => {
    expect(power([OV.kingdew7])).toBe(4000);
  });

  it('a Character with cost 8 or more but no Whitebeard type (Accino cost 8) does not', () => {
    expect(power([OV.accino10])).toBe(4000);
  });

  it('"or more": a {Whitebeard Pirates} Character with cost 9 (OP02-004 Newgate) also removes it', () => {
    expect(power(['OP02-004'])).toBe(8000);
  });

  it('LittleOars itself (cost 4) does not count; two LittleOars both stay at 4000', () => {
    const g = mine(OL.luffy, { characters: [OARS, OARS] });
    expect(pw(g, 'p1', OARS, 0)).toBe(4000);
    expect(pw(g, 'p1', OARS, 1)).toBe(4000);
  });

  it('only my Characters count: an opponent\'s {Whitebeard Pirates} cost-8 Character does not', () => {
    expect(power([], [WB8])).toBe(4000);
  });

  it('the penalty is re-evaluated: playing a qualifying Character from hand lifts it to 8000', () => {
    const g = mine(OL.luffy, { characters: [OARS], hand: [WB8] });
    expect(pw(g, 'p1', OARS)).toBe(4000);
    playCard(g, WB8);
    expect(atMain(g)).toBe(true);
    expect(pw(g, 'p1', OARS)).toBe(8000);
  });

  it('it has [Blocker]', () => {
    const g = mine(OL.luffy, { characters: [OARS] });
    expect(kw(g, at(g, 'p1', 'characters', OARS))).toContain('Blocker');
  });

  it('the reduced 4000 power matters in a block: a 5000 attacker K.O.s a blocking LittleOars alone, not one with support', () => {
    const alone = theirs(
      OL.luffy,
      { characters: [OARS] },
      { characters: [OV.marco5] },
    );
    attack(alone, at(alone, 'p2', 'characters', OV.marco5), alone.leader('p1'));
    expect(blockers(alone)).toEqual([at(alone, 'p1', 'characters', OARS)]);
    alone.act({ type: 'block', blocker: at(alone, 'p1', 'characters', OARS) });
    alone.act({ type: 'endCounter' });
    expect(charIds(alone, 'p1')).toEqual([]);

    const supported = theirs(
      OL.luffy,
      { characters: [OARS, WB8] },
      { characters: [OV.marco5] },
    );
    attack(supported, at(supported, 'p2', 'characters', OV.marco5), supported.leader('p1'));
    supported.act({ type: 'block', blocker: at(supported, 'p1', 'characters', OARS) });
    supported.act({ type: 'endCounter' });
    expect(charIds(supported, 'p1')).toEqual([OARS, WB8].sort());
  });
});
