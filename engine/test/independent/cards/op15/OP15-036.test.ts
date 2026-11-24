/**
 * OP15-036 Ryuma (Character, Green, cost 6, 8000, no Counter, {Land of Wano}/{Thriller Bark
 * Pirates}).
 *
 * Card text: "[On Play]/[When Attacking] K.O. up to 1 of your opponent's rested Characters with a cost
 * of 4 or less."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 10-2-1 (K.O.), CR 7-1-2 ([When Attacking] resolves at the attack
 * declaration, before the Block Step).
 */
import { describe, expect, it } from 'vitest';
import { attack, noDefence } from './kit-op15a.ts';
import {
  at,
  chars,
  chr,
  LD15,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  SCN,
  trash,
} from './kit-op15a.ts';

const RYUMA = 'OP15-036';

type P = string | { card: string; rested?: boolean };

/** p1 plays Ryuma from hand (my rested Marco on my side); p2's Characters as given. */
function onPlay(p2chars: P[], mychars: P[] = []) {
  const g = mine(LD15.luffy, { hand: [RYUMA], characters: mychars }, { characters: p2chars });
  playRaw(g, RYUMA);
  return g;
}

describe('OP15-036 Ryuma: [On Play] K.O. up to 1 rested Character with cost 4 or less', () => {
  it('offers only rested opposing Characters with cost 4 or less', () => {
    const g = onPlay([
      { card: SCN.c3, rested: true },
      { card: SCN.c4, rested: true },
      { card: SCN.c5, rested: true },
      { card: SCN.c2 },
    ]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c3, SCN.c4].sort());
  });

  it('boundary: cost 4 is allowed, cost 5 is not', () => {
    const g = onPlay([
      { card: SCN.c4, rested: true },
      { card: SCN.c5, rested: true },
    ]);
    expect(offeredIds(g)).toEqual([SCN.c4]);
  });

  it('K.O.s the chosen Character into its owner trash', () => {
    const g = onPlay([{ card: SCN.c4, rested: true }]);
    pickInst(g, [chr(g, 'p2', SCN.c4)]);
    need(g, 'main', 'p1');
    expect(chars(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([SCN.c4]);
  });

  it('an active Character with cost 4 or less is never offered', () => {
    const g = onPlay([{ card: SCN.c3 }]);
    if (g.legal().some((a) => a.type === 'done')) {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    need(g, 'main', 'p1');
    expect(chars(g, 'p2')).toEqual([SCN.c3]);
  });

  it('"up to 1": choosing nothing K.O.s nothing', () => {
    const g = onPlay([{ card: SCN.c3, rested: true }]);
    none(g);
    expect(chars(g, 'p2')).toEqual([SCN.c3]);
  });

  it('only one Character is K.O.d even when two qualify', () => {
    const g = onPlay([
      { card: SCN.c3, rested: true },
      { card: SCN.c4, rested: true },
    ]);
    pickInst(g, [chr(g, 'p2', SCN.c3)]);
    need(g, 'main', 'p1');
    expect(chars(g, 'p2')).toEqual([SCN.c4]);
  });

  it('my own rested Characters are never offered', () => {
    const g = onPlay([{ card: SCN.c3, rested: true }], [{ card: SCN.c2, rested: true }]);
    expect(offeredIds(g)).toEqual([SCN.c3]);
  });
});

describe('OP15-036 Ryuma: [When Attacking] K.O. up to 1 rested Character with cost 4 or less', () => {
  function attackGame(p2chars: P[]) {
    const g = mine(LD15.luffy, { characters: [RYUMA] }, { characters: p2chars });
    attack(g, at(g, 'p1', 'characters', RYUMA), g.leader('p2'));
    return g;
  }

  it('attacking triggers the same K.O. with the same filter', () => {
    const g = attackGame([
      { card: SCN.c4, rested: true },
      { card: SCN.c5, rested: true },
      { card: SCN.c3 },
    ]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c4]);
    pickInst(g, [chr(g, 'p2', SCN.c4)]);
    expect(chars(g, 'p2')).toEqual([SCN.c3, SCN.c5].sort());
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('"up to": the attack proceeds with nothing K.O.d when I choose nothing', () => {
    const g = attackGame([{ card: SCN.c4, rested: true }]);
    none(g);
    expect(chars(g, 'p2')).toEqual([SCN.c4]);
  });
});
