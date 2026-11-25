/**
 * PRB02-006 Roronoa Zoro (Character, cost 4, 4000, Counter +2000, {Straw Hat Crew}/{Supernovas},
 * [Blocker]).
 *
 * Card text: "[Opponent's Turn] If this Character would be rested by your opponent's Character's
 * effect, you may rest 1 of your other Characters instead. [Blocker]"
 *
 * Rules: a replacement effect (CR 8-1-3-4) applies only to the stated cause: an effect of one of the
 * opponent's CHARACTER cards, not an Event's effect and not resting by blocking or attacking. It is
 * optional ("you may"). "Instead" means the other Character is rested and Zoro is not.
 */
import { describe, expect, it } from 'vitest';
import {
  accept,
  at,
  attack,
  blockers,
  choices,
  chr,
  decline,
  kind,
  kw,
  LDP,
  need,
  offeredIds,
  pickInst,
  playRaw,
  SP,
  theirs,
  unusable,
  act,
  decision,
  takeMost,
} from './kit-prb02sta.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ZO = 'PRB02-006';

function theirBoard(p1chars: (string | { card: string; rested?: boolean })[], p2hand: string[]) {
  return theirs(
    LDP.neutral,
    { characters: p1chars },
    { hand: p2hand, costArea: { active: 10, rested: 0 } },
  );
}

/** p2 plays Howling Gab (a Character; [On Play] rest up to 1 of the opponent's Characters) and rests `target`. */
function gabRests(g: TestGame, target: string) {
  playRaw(g, SP.gab);
  pickInst(g, [target]);
}

const rested = (g: TestGame, card: string) => g.card(at(g, 'p1', 'characters', card)).rested;

describe("PRB02-006 Zoro: [Opponent's Turn] if rested by an opponent's Character effect, may rest another Character instead; [Blocker]", () => {
  it('printed values: cost 4, 4000 power, Counter +2000, [Blocker]', () => {
    const g = theirBoard([ZO], []);
    const i = at(g, 'p1', 'characters', ZO);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([4, 4000, 2000]);
    expect(kw(g, i)).toContain('Blocker');
  });

  it("rested by a Character's effect on their turn: the replacement is offered to the controller", () => {
    const g = theirBoard([ZO, SP.c1p3], [SP.gab]);
    gabRests(g, at(g, 'p1', 'characters', ZO));
    expect(need(g, 'optional', 'p1').purpose).toBe('replacement');
  });

  it('accepting: Zoro stays active and the chosen other Character is rested instead', () => {
    const g = theirBoard([ZO, SP.c1p3, SP.c2p4], [SP.gab]);
    gabRests(g, at(g, 'p1', 'characters', ZO));
    accept(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', SP.c2p4)]);
    expect(rested(g, ZO)).toBe(false);
    expect(rested(g, SP.c2p4)).toBe(true);
    expect(rested(g, SP.c1p3)).toBe(false);
  });

  it("the pick offers only my other Characters: not Zoro itself, not a Leader, not the opponent's Characters", () => {
    const g = theirBoard([ZO, SP.c1p3, SP.c2p4], [SP.gab]);
    gabRests(g, at(g, 'p1', 'characters', ZO));
    accept(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', ZO));
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(chr(g, 'p2', SP.gab));
    expect(offeredIds(g)).toEqual([SP.c1p3, SP.c2p4].sort());
  });

  it('declining ("you may"): Zoro is rested as usual and the other Character is untouched', () => {
    const g = theirBoard([ZO, SP.c1p3], [SP.gab]);
    gabRests(g, at(g, 'p1', 'characters', ZO));
    decline(g);
    expect(rested(g, ZO)).toBe(true);
    expect(rested(g, SP.c1p3)).toBe(false);
  });

  it('with no other Character the replacement cannot be used: Zoro is rested (no usable question)', () => {
    const g = theirBoard([ZO], [SP.gab]);
    gabRests(g, at(g, 'p1', 'characters', ZO));
    unusable(g, 'p1');
    expect(rested(g, ZO)).toBe(true);
  });

  it('the other Character chosen is a cost-free substitute: exactly one other Character is rested', () => {
    const g = theirBoard([ZO, SP.c1p3, SP.c2p4], [SP.gab]);
    gabRests(g, at(g, 'p1', 'characters', ZO));
    accept(g);
    pickInst(g, [at(g, 'p1', 'characters', SP.c1p3)]);
    const restedCount = [ZO, SP.c1p3, SP.c2p4].filter((c) => rested(g, c)).length;
    expect(restedCount).toBe(1);
  });

  it("an Event's rest effect is not a Character's effect: no question, Zoro is simply rested", () => {
    const g = theirBoard([ZO, SP.c1p3], [SP.elephantGun]);
    playRaw(g, SP.elephantGun);
    pickInst(g, [at(g, 'p1', 'characters', ZO)]);
    if (kind(g) === 'choose' && decision(g)?.player === 'p2') takeMost(g);
    expect(kind(g)).not.toBe('optional');
    expect(rested(g, ZO)).toBe(true);
    expect(rested(g, SP.c1p3)).toBe(false);
  });

  it('resting by blocking is not an effect: Zoro blocks, is rested, and nothing is asked', () => {
    const g = theirBoard([ZO, SP.c1p3], []);
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toContain(at(g, 'p1', 'characters', ZO));
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ZO) });
    expect(kind(g)).not.toBe('optional');
    expect(rested(g, ZO)).toBe(true);
    expect(rested(g, SP.c1p3)).toBe(false);
  });

  it('another Character of mine rested by the same Character effect is not protected (Zoro only protects itself)', () => {
    const g = theirBoard([ZO, SP.c1p3], [SP.gab]);
    gabRests(g, at(g, 'p1', 'characters', SP.c1p3));
    expect(kind(g)).not.toBe('optional');
    expect(rested(g, SP.c1p3)).toBe(true);
    expect(rested(g, ZO)).toBe(false);
  });
});
