/**
 * OP17-057 Fullalead (Stage, Blue, cost 1, {Rocks Pirates}).
 *
 * Card text: "[On Your Opponent's Attack] You may rest this Stage and trash 1 card from your hand: Up
 * to 1 of your Leader with a type including "Rocks Pirates" or up to 1 of your Characters with a
 * type including "Rocks Pirates" gains +1000 power during this battle."
 *
 * Rules: CR 10-2-16 (activates whatever is attacked), CR 8-3-1-3 (cost: a rested Stage cannot be
 * rested again), CR 2-4-3-1 (type including), M6b-Q16 (one target in total), RL-08 (this battle).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  canUse,
  choices,
  hand,
  kind,
  LD,
  need,
  no,
  none,
  offeredIds,
  passBlock,
  passCounter,
  payHand,
  pickCards,
  pickInst,
  RED,
  SCN,
  side,
  theirTurn,
  trash,
  unusable,
  yes,
  mayChooseNone,
} from './kit-op17b.ts';

const STAGE = 'OP17-057';
const KYO = 'OP17-045'; // Blue, cost 2, 4000, {Rocks Pirates}
const BUCKIN = 'OP08-051'; // Blue, cost 1, 2000, Counter +1000, {Former Rocks Pirates}

function defending(opts: {
  leader?: string;
  chars?: string[];
  hand?: string[];
  stageRested?: boolean;
  p2chars?: string[];
}) {
  const g = theirTurn(
    side(opts.leader ?? LD.rocks, BLUE, {
      stage: { card: STAGE, rested: opts.stageRested ?? false },
      characters: opts.chars ?? [],
      hand: opts.hand ?? [SCN.c2],
    }),
    side(LD.luffy, RED, {
      costArea: { active: 10, rested: 0 },
      characters: opts.p2chars ?? [SCN.c3],
    }),
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  return g;
}

describe("OP17-057 Fullalead: [On Your Opponent's Attack] rest this Stage, trash 1: Rocks Pirates +1000", () => {
  it('rests the Stage, trashes the chosen card, and the {Rocks Pirates} Leader gets +1000 for the battle', () => {
    const g = defending({ hand: [BLUE, SCN.c2] });
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [SCN.c2]);
    need(g, 'choose');
    pickInst(g, [g.leader('p1')]);
    expect(g.card(g.find('p1', 'stage', STAGE)).rested).toBe(true);
    expect(trash(g)).toEqual([SCN.c2]);
    expect(hand(g)).toEqual([BLUE]);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('the boost lasts during the battle only', () => {
    const g = defending({});
    yes(g);
    payHand(g, [SCN.c2]);
    pickInst(g, [g.leader('p1')]);
    passBlock(g);
    expect(g.power(g.leader('p1'))).toBe(6000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a {Rocks Pirates} Character can be the target, and a type that merely includes "Rocks Pirates" qualifies', () => {
    const g = defending({ chars: [KYO, BUCKIN, SCN.c4] });
    yes(g);
    payHand(g, [SCN.c2]);
    need(g, 'choose');
    expect(offeredIds(g)).toContain(KYO);
    expect(offeredIds(g)).toContain(BUCKIN);
    expect(offeredIds(g)).not.toContain(SCN.c4);
    pickCards(g, [BUCKIN]);
    expect(g.power(at(g, 'p1', 'characters', BUCKIN))).toBe(3000);
  });

  it('a Leader without a "Rocks Pirates" type is not a candidate', () => {
    const g = defending({ leader: LD.neutral, chars: [KYO] });
    yes(g);
    payHand(g, [SCN.c2]);
    need(g, 'choose');
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(offeredIds(g)).toEqual([KYO]);
  });

  it('one target in total: the Leader and a Character cannot both be boosted (M6b-Q16)', () => {
    const g = defending({ chars: [KYO] });
    yes(g);
    payHand(g, [SCN.c2]);
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(at(g, 'p1', 'characters', KYO))).toBe(4000);
    expect(kind(g)).toBe('block');
  });

  it('"up to 1": after paying the cost the target may be skipped (Stage stays rested, card stays trashed)', () => {
    const g = defending({});
    yes(g);
    payHand(g, [SCN.c2]);
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.card(g.find('p1', 'stage', STAGE)).rested).toBe(true);
    expect(trash(g)).toEqual([SCN.c2]);
  });

  it('declining: the Stage stays active, the hand is untouched, no boost', () => {
    const g = defending({});
    no(g);
    expect(g.card(g.find('p1', 'stage', STAGE)).rested).toBe(false);
    expect(hand(g)).toEqual([SCN.c2]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-1-3: an already rested Stage cannot pay "rest this Stage", so nothing is offered', () => {
    const g = defending({ stageRested: true });
    unusable(g, 'p1');
    expect(kind(g)).toBe('block');
    expect(hand(g)).toEqual([SCN.c2]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-1-3: with an empty hand the trash half cannot be paid, so the Stage is not rested either', () => {
    const g = defending({ hand: [] });
    unusable(g, 'p1');
    expect(kind(g)).toBe('block');
    expect(g.card(g.find('p1', 'stage', STAGE)).rested).toBe(false);
  });

  it('is offered when one of my rested Characters is attacked, not only for Leader attacks', () => {
    const g = theirTurn(
      side(LD.rocks, BLUE, {
        stage: STAGE,
        characters: [{ card: KYO, rested: true }],
        hand: [SCN.c2],
      }),
      side(LD.luffy, RED, { characters: [SCN.c3] }),
    );
    attack(g, g.find('p2', 'characters', SCN.c3), g.find('p1', 'characters', KYO));
    expect(canUse(g)).toBe(true);
  });

  it('after use the Stage is rested, so a second attack the same turn does not offer it again', () => {
    const g = defending({ hand: [SCN.c2, SCN.c3], p2chars: [SCN.c3] });
    yes(g);
    payHand(g, [SCN.c2]);
    pickInst(g, [g.leader('p1')]);
    passBlock(g);
    passCounter(g);
    attack(g, g.find('p2', 'characters', SCN.c3), g.leader('p1'));
    expect(canUse(g)).toBe(false);
    unusable(g, 'p1');
    expect(kind(g)).toBe('block');
  });
});
