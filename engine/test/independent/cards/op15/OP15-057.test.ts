/**
 * OP15-057 Dressrosa Kingdom (Stage, Blue, cost 1, {Dressrosa}).
 *
 * Card text: "[On Play] If your Leader has the {Dressrosa} type, draw 1 card.
 * [On Your Opponent's Attack] You may rest this Stage and trash 1 Event or Stage card from your hand:
 * Up to 1 of your Leader or Character cards gains +2000 power during this battle."
 *
 * Rules: CR 8-3-3 (condition), CR 8-3-1-3 / 8-3-1-4 (costs: an unpayable cost cannot be paid; a "may" cost
 * can be skipped), CR 10-2-16 ([On Your Opponent's Attack] is decided before Counters, whatever the
 * target), CR 7-1-4 (the attacker wins a power tie), CR 1-3-2-1 (resting a rested card does nothing).
 * Scenery: ST01-014 Guard Point (Red Event), OP05-021 Revolutionary Army HQ (Red Stage).
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  choices,
  deck,
  hand,
  inst,
  kind,
  LD15,
  mine,
  mustBeUnpayable,
  need,
  no,
  none,
  offeredIds,
  payHand,
  pickInst,
  playRaw,
  RED,
  SCN,
  side,
  theirTurn,
  theirs,
  trash,
  yes,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const KINGDOM = 'OP15-057';
const EVENT = 'ST01-014';
const STAGE2 = 'OP05-021';
const DRAW = [SCN.c2, SCN.c3, BLUE, BLUE, BLUE];

/** p2 attacks p1's Leader with a 6000 Character (c4); p1 has the Stage in play. */
function defend(
  o: { hand?: string[]; rested?: boolean; chars?: string[]; leader?: string } = {},
): TestGame {
  const g = theirTurn(
    side(o.leader ?? LD15.dressrosa, BLUE, {
      stage: o.rested ? { card: KINGDOM, rested: true } : KINGDOM,
      hand: o.hand ?? [EVENT],
      characters: o.chars ?? [],
    }),
    side(LD15.neutral, RED, { characters: [SCN.c4] }),
  );
  attack(g, inst(g, 'p2', 'characters', SCN.c4), g.leader('p1'));
  return g;
}

describe('OP15-057 Dressrosa Kingdom: [On Play] draw 1 with a {Dressrosa} Leader; [On Your Opponent’s Attack] rest + trash Event/Stage: +2000', () => {
  it('[On Play] with a {Dressrosa} Leader: draws 1 card', () => {
    const g = mine(LD15.dressrosa, { hand: [KINGDOM], deck: DRAW });
    playRaw(g, KINGDOM);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCN.c2]);
    expect(deck(g)).toHaveLength(4);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([KINGDOM]);
  });

  it('[On Play] with a Leader without the type: draws nothing', () => {
    const g = mine(LD15.shc, { hand: [KINGDOM], deck: DRAW });
    playRaw(g, KINGDOM);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(5);
  });

  it('an attack on my Leader: trash an Event, rest the Stage, my Leader gets +2000 and the 6000 attacker no longer connects', () => {
    const g = defend({ hand: [EVENT, BLUE] });
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payHand(g, [EVENT]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.card(inst(g, 'p1', 'stage', KINGDOM)).rested).toBe(true);
    expect(trash(g)).toEqual([EVENT]);
    expect(hand(g)).toEqual([BLUE]);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('control: declining leaves the Stage active, the hand intact, and the 6000 attacker connects', () => {
    const g = defend();
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(g.card(inst(g, 'p1', 'stage', KINGDOM)).rested).toBe(false);
    expect(hand(g)).toEqual([EVENT]);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('a Stage card from hand pays the cost as well as an Event', () => {
    const g = defend({ hand: [STAGE2] });
    yes(g, 'p1');
    payHand(g, [STAGE2]);
    pickInst(g, [g.leader('p1')]);
    expect(trash(g)).toEqual([STAGE2]);
  });

  it('only Event or Stage cards are candidates for the trash (Characters are not offered)', () => {
    const g = defend({ hand: [EVENT, STAGE2, SCN.c3, BLUE] });
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g).every((c) => c === EVENT || c === STAGE2)).toBe(true);
    expect(offeredIds(g)).not.toContain(SCN.c3);
    expect(offeredIds(g)).not.toContain(BLUE);
  });

  it('CR 8-3-1-3: with only Characters in hand the cost cannot be paid', () => {
    const g = defend({ hand: [SCN.c3, BLUE] });
    mustBeUnpayable(g, 'p1');
    expect(kind(g)).toBe('block');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).toEqual([SCN.c3, BLUE].sort());
  });

  it('CR 8-3-1-3: a Stage that is already rested cannot be rested again as the cost', () => {
    const g = defend({ rested: true });
    mustBeUnpayable(g, 'p1');
    expect(kind(g)).toBe('block');
    expect(hand(g)).toEqual([EVENT]);
  });

  it('the boost may go to one of my Characters instead of the Leader (the attack is redirected to it)', () => {
    const g = theirTurn(
      side(LD15.dressrosa, BLUE, {
        stage: KINGDOM,
        hand: [EVENT],
        characters: [{ card: SCN.c4, rested: true }],
      }),
      side(LD15.neutral, RED, { characters: [SCN.c4] }),
    );
    attack(g, inst(g, 'p2', 'characters', SCN.c4), inst(g, 'p1', 'characters', SCN.c4));
    yes(g, 'p1');
    payHand(g, [EVENT]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(inst(g, 'p1', 'characters', SCN.c4));
    expect(choices(g)).not.toContain(inst(g, 'p2', 'characters', SCN.c4));
    expect(choices(g)).not.toContain(g.leader('p2'));
    pickInst(g, [inst(g, 'p1', 'characters', SCN.c4)]);
    expect(g.power(inst(g, 'p1', 'characters', SCN.c4))).toBe(8000);
    passBlock(g);
    passCounter(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([SCN.c4]);
  });

  it('"up to 1": choosing nobody is legal; the cost stays paid', () => {
    const g = defend();
    yes(g, 'p1');
    payHand(g, [EVENT]);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(trash(g)).toEqual([EVENT]);
    expect(g.card(inst(g, 'p1', 'stage', KINGDOM)).rested).toBe(true);
  });

  it('the +2000 lasts only for this battle', () => {
    const g = defend();
    yes(g, 'p1');
    payHand(g, [EVENT]);
    pickInst(g, [g.leader('p1')]);
    passBlock(g);
    passCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('must not: on my own attack the Stage offers nothing', () => {
    const g = mine(LD15.dressrosa, { stage: KINGDOM, hand: [EVENT] });
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(kind(g)).toBe('block');
  });
});

void theirs;
