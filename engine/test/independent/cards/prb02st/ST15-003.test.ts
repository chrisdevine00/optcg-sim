/**
 * ST15-003 Kingdew (Character, cost 3, 4000, Counter +1000, {Whitebeard Pirates}, [Blocker]).
 *
 * Card text: "[Blocker] [Opponent's Turn] When this Character is K.O.'d by an effect, up to 1 of your
 * Leader gains +2000 power during this turn."
 *
 * Rules: [Opponent's Turn] abilities work only during the opponent's turn (CR 10-2-x). A K.O. in
 * battle is not a K.O. "by an effect". "Up to 1" may be answered with nothing. "During this turn"
 * ends with the turn the K.O. happened in.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  blockers,
  choose,
  endTurn,
  kw,
  LDP,
  leadPow,
  mine,
  need,
  none,
  noDefence,
  offeredIds,
  opponentKOs,
  passBlock,
  SP,
  sorted,
  takeMost,
  theirs,
  kind,
  useAbility,
  pickInst,
} from './kit-prb02sta.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const KD = 'ST15-003';

/** p2's turn: p2 holds Gum-Gum Lightning (K.O. 6000 power or less) with 10 DON!!. */
function theirBoard(p1chars: (string | { card: string; rested?: boolean })[] = [KD]) {
  return theirs(
    LDP.neutral,
    { characters: p1chars },
    { hand: [SP.lightning], costArea: { active: 10, rested: 0 } },
  );
}

/** p2 K.O.s `target` with Gum-Gum Lightning; the engine stops at the first decision after the K.O. */
function lightning(g: TestGame, card: string) {
  opponentKOs(g, at(g, 'p1', 'characters', card));
}

/** Finish Lightning's "add up to 1 DON!!" count question for p2 if it is pending. */
function finishLightning(g: TestGame) {
  if (kind(g) === 'choose') takeMost(g);
}

describe("ST15-003 Kingdew: [Blocker]; [Opponent's Turn] K.O.'d by an effect: Leader +2000 this turn", () => {
  it('printed values: cost 3, 4000 power, Counter +1000, [Blocker]', () => {
    const g = theirBoard();
    const k = at(g, 'p1', 'characters', KD);
    expect(g.card(k).cost).toBe(3);
    expect(g.power(k)).toBe(4000);
    expect(g.card(k).counter).toBe(1000);
    expect(kw(g, k)).toContain('Blocker');
  });

  it('[Blocker]: it can be chosen to block an attack on the Leader', () => {
    const g = theirBoard();
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', KD)]);
  });

  it("K.O.d by the opponent's effect on their turn: the Leader gains +2000 power (5000 -> 7000)", () => {
    const g = theirBoard();
    lightning(g, KD);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LDP.neutral]);
    choose(g, [g.leader('p1')]);
    finishLightning(g);
    expect(sorted(g, 'p1', 'trash')).toEqual([KD]);
    expect(leadPow(g, 'p1')).toBe(7000);
  });

  it('"up to 1": choosing nothing leaves the Leader at 5000', () => {
    const g = theirBoard();
    lightning(g, KD);
    need(g, 'choose', 'p1');
    none(g);
    finishLightning(g);
    expect(leadPow(g, 'p1')).toBe(5000);
    expect(sorted(g, 'p1', 'trash')).toEqual([KD]);
  });

  it('the +2000 lasts through the rest of that turn and is gone on my next turn', () => {
    const g = theirBoard();
    lightning(g, KD);
    choose(g, [g.leader('p1')]);
    finishLightning(g);
    expect(leadPow(g, 'p1')).toBe(7000);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(leadPow(g, 'p1')).toBe(5000);
  });

  it('the boosted Leader holds against a 6000-power attack in the same turn (7000 vs 6000)', () => {
    const g = theirs(
      LDP.neutral,
      { characters: [KD] },
      {
        hand: [SP.lightning],
        costArea: { active: 10, rested: 0 },
        characters: [{ card: SP.c4p6 }],
      },
    );
    lightning(g, KD);
    choose(g, [g.leader('p1')]);
    finishLightning(g);
    attack(g, at(g, 'p2', 'characters', SP.c4p6), g.leader('p1'));
    passBlock(g);
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it('K.O.d in battle on the opponent\'s turn: not "by an effect", no boost and nothing is asked', () => {
    const g = theirBoard([{ card: KD, rested: true }]);
    attack(g, g.leader('p2'), at(g, 'p1', 'characters', KD));
    need(g, 'block', 'p1');
    noDefence(g);
    expect(sorted(g, 'p1', 'trash')).toEqual([KD]);
    expect(leadPow(g, 'p1')).toBe(5000);
    need(g, 'main', 'p2');
  });

  it("K.O.d by my own effect on my own turn: [Opponent's Turn] does not apply, no boost, nothing is asked", () => {
    const g = mine(LDP.neutral, { characters: [KD, SP.teachKo] });
    useAbility(g, at(g, 'p1', 'characters', SP.teachKo));
    pickInst(g, [at(g, 'p1', 'characters', KD)]);
    expect(sorted(g, 'p1', 'trash')).toContain(KD);
    expect(kind(g)).toBe('main');
    expect(leadPow(g, 'p1')).toBe(5000);
  });

  it("another Character of mine K.O.d by the opponent's effect does not trigger Kingdew", () => {
    const g = theirBoard([KD, SP.c1p3]);
    lightning(g, SP.c1p3);
    finishLightning(g);
    expect(sorted(g, 'p1', 'characters')).toEqual([KD]);
    expect(leadPow(g, 'p1')).toBe(5000);
    expect(kind(g)).toBe('main');
  });

  it('two copies K.O.d one after the other each give +2000 (Leader 9000)', () => {
    const g = theirs(
      LDP.neutral,
      { characters: [KD, KD] },
      { hand: [SP.lightning, SP.lightning], costArea: { active: 10, rested: 0 } },
    );
    lightning(g, KD);
    choose(g, [g.leader('p1')]);
    finishLightning(g);
    expect(leadPow(g, 'p1')).toBe(7000);
    lightning(g, KD);
    choose(g, [g.leader('p1')]);
    finishLightning(g);
    expect(leadPow(g, 'p1')).toBe(9000);
  });
});
