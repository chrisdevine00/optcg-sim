/**
 * PRB02-009 Mr.3(Galdino) (Character, cost 2, 1000, Counter +1000, {Former Baroque Works}/{Cross
 * Guild}, [Blocker]).
 *
 * Card text: "This effect can be activated when this Character is rested by your opponent's effect. You
 * may trash this Character and draw 2 cards. [Blocker]"
 *
 * Rules: the effect activates only after this Character is rested BY AN EFFECT of the opponent
 * (open question M6b-Q41: whether a rest paid as a cost counts is not asserted here). Resting by
 * blocking or by attacking is not an effect. "You may" lets the player decline; if trashed, the
 * draw is exactly 2. The effect belongs to Mr.3 only, not to the other Characters.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  blockers,
  canUse,
  decision,
  deck,
  hand,
  kind,
  kw,
  LDP,
  need,
  no,
  pickInst,
  playRaw,
  SP,
  sorted,
  takeMost,
  theirs,
  yes,
} from './kit-prb02sta.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const M3 = 'PRB02-009';
const TOP = [SP.c1p3, SP.c2p4, SP.c3p5, SP.c4p6];

function theirBoard(p1chars: (string | { card: string; rested?: boolean })[], p2hand: string[]) {
  return theirs(
    LDP.neutral,
    { characters: p1chars, deck: TOP },
    { hand: p2hand, characters: [], costArea: { active: 10, rested: 0 } },
  );
}

/** p2 plays Howling Gab ([On Play] rest up to 1 of the opponent's Characters) and rests `card`. */
function gabRests(g: TestGame, card: string) {
  playRaw(g, SP.gab);
  pickInst(g, [at(g, 'p1', 'characters', card)]);
}

describe("PRB02-009 Mr.3: when rested by the opponent's effect, may trash this and draw 2; [Blocker]", () => {
  it('printed values: cost 2, 1000 power, Counter +1000, [Blocker]', () => {
    const g = theirBoard([M3], []);
    const i = at(g, 'p1', 'characters', M3);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([2, 1000, 1000]);
    expect(kw(g, i)).toContain('Blocker');
  });

  it("rested by a Character's effect: the controller is asked whether to use it", () => {
    const g = theirBoard([M3], [SP.gab]);
    gabRests(g, M3);
    const d = need(g, 'optional', 'p1');
    expect(d.player).toBe('p1');
    expect(canUse(g)).toBe(true);
  });

  it('accepting: Mr.3 is trashed and exactly 2 cards are drawn (the top two)', () => {
    const g = theirBoard([M3], [SP.gab]);
    gabRests(g, M3);
    yes(g, 'p1');
    expect(sorted(g, 'p1', 'trash')).toEqual([M3]);
    expect(sorted(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([SP.c1p3, SP.c2p4].sort());
    expect(deck(g)).toEqual([SP.c3p5, SP.c4p6]);
  });

  it('"you may": declining leaves Mr.3 on the field, rested, and draws nothing', () => {
    const g = theirBoard([M3], [SP.gab]);
    gabRests(g, M3);
    no(g, 'p1');
    expect(sorted(g, 'p1', 'characters')).toEqual([M3]);
    expect(g.card(at(g, 'p1', 'characters', M3)).rested).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('an Event\'s rest effect counts as "your opponent\'s effect" as well', () => {
    const g = theirBoard([M3], [SP.elephantGun]);
    playRaw(g, SP.elephantGun);
    pickInst(g, [at(g, 'p1', 'characters', M3)]);
    if (decision(g)?.player === 'p1') {
      yes(g, 'p1');
    } else {
      throw new Error('p1 was not asked');
    }
    if (decision(g)?.kind === 'choose' && decision(g)?.player === 'p2') takeMost(g);
    expect(sorted(g, 'p1', 'trash')).toEqual([M3]);
    expect(hand(g)).toHaveLength(2);
  });

  it('resting by blocking is not an effect: Mr.3 blocks, is rested, and nothing is asked', () => {
    const g = theirs(LDP.neutral, { characters: [M3], deck: TOP }, { characters: [SP.c1p3] });
    attack(g, at(g, 'p2', 'characters', SP.c1p3), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', M3)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', M3) });
    expect(kind(g)).not.toBe('optional');
    expect(g.card(at(g, 'p1', 'characters', M3)).rested).toBe(true);
    expect(hand(g)).toEqual([]);
  });

  it("another Character of mine rested by the opponent's effect does not activate Mr.3's effect", () => {
    const g = theirBoard([M3, SP.c1p3], [SP.gab]);
    gabRests(g, SP.c1p3);
    expect(kind(g)).not.toBe('optional');
    expect(sorted(g, 'p1', 'characters')).toEqual([M3, SP.c1p3].sort());
    expect(hand(g)).toEqual([]);
  });

  it('with two copies on the field only the rested one is asked about and trashed', () => {
    const g = theirBoard([M3, M3], [SP.gab]);
    playRaw(g, SP.gab);
    pickInst(g, [at(g, 'p1', 'characters', M3, 0)]);
    yes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(sorted(g, 'p1', 'characters')).toEqual([M3]);
    expect(g.card(at(g, 'p1', 'characters', M3)).rested).toBe(false);
    expect(hand(g)).toHaveLength(2);
  });
});
