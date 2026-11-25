/**
 * ST33-004 Borsalino (Blue Character, cost 6, 6000, Counter +2000, {Navy}, attribute Special).
 *
 * Card text: "During the turn in which a card in your hand is trashed by an effect, give this card in
 * your hand -3 cost. [Blocker] ..."
 *
 * Rules: a card trashed from a hand as an effect's cost counts as "trashed by an effect"
 * (task brief). Only a card trashed from the HAND of the Borsalino's owner counts ("a card in your
 * hand"); playing a card, using it as a Counter, or the opponent's hand being trashed does not. The
 * discount applies to this card while it is in the hand, once (not per trashed card), and lasts
 * for the rest of that turn only (the turn in which the trash happened, either player's turn).
 *
 * Open question (M6b-Q87): whether a trash that happened EARLIER in the turn (before this card was
 * drawn) counts. No test here depends on that.
 */
import { describe, expect, it } from 'vitest';
import type { InstanceId } from '@optcg/engine';
import { act, attack } from '../../helpers.ts';
import {
  activateCounter,
  answerOptional,
  at,
  atMain,
  blockers,
  BLUE,
  cst,
  dons,
  kind,
  LD14,
  mine,
  need,
  none,
  pendingKind,
  playable,
  playId,
  playRaw,
  pickInst,
  SC14,
  theirs,
  toMyNextMain,
  yes,
} from './kit-lfd.ts';

const BORS = 'ST33-004';
/** OP09-110: Yellow, cost 2, 2000. [On Play] Draw 2 cards and trash 2 cards from your hand. */
const LOOTER = 'OP09-110';
/** EB03-025: cost 5. [On Play] You may trash 1 card from your hand: return up to 1 Character with 6000 base power to the hand. */
const COSTLY = 'EB03-025';
/** OP09-087: Black, cost 2, 0 power. [On Play] If your opponent has 5 or more cards in hand, they trash 1. */
const FORCER = 'OP09-087';
/** OP17-097: Black Event, cost 1. [Counter] Leader +3000 power. */
const COUNTER_EVENT = SC14.shrink;

/** The instances of `card` in `who`'s hand. */
function ids(g: ReturnType<typeof mine>, card: string, who: 'p1' | 'p2' = 'p1'): InstanceId[] {
  return g
    .zone(who, 'hand')
    .filter((c) => c.card === card)
    .map((c) => c.instance);
}

/** My Main Phase. p1's hand is `hand`; the deck is plain filler. */
function mainWith(hand: string[], active = 10, p2hand: string[] = []) {
  return mine(
    LD14.neutral,
    { hand, deck: Array.from({ length: 12 }, () => BLUE), costArea: { active, rested: 0 } },
    { hand: p2hand },
  );
}

/** Play OP09-110 and trash two plain fillers from the hand (the draw puts two fresh ones there). */
function loot(g: ReturnType<typeof mine>) {
  playId(g, LOOTER);
  need(g, 'choose', 'p1');
  const two = ids(g, BLUE).slice(0, 2);
  pickInst(g, two);
}

const bors = (g: ReturnType<typeof mine>) => ids(g, BORS)[0]!;

describe('ST33-004 Borsalino: during the turn a card in your hand is trashed by an effect, this card in your hand gets -3 cost', () => {
  it('baseline: nothing trashed this turn: cost 6 in hand', () => {
    const g = mainWith([BORS, LOOTER, BLUE]);
    expect(cst(g, bors(g))).toBe(6);
  });

  it('a card trashed from my hand by my own effect: cost 3 for the rest of the turn', () => {
    const g = mainWith([BORS, LOOTER, BLUE]);
    loot(g);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p1', 'trash').length).toBe(2);
    expect(cst(g, bors(g))).toBe(3);
  });

  it('two cards trashed in one turn: only -3 once (cost 3, not 0)', () => {
    const g = mainWith([BORS, LOOTER, BLUE, LOOTER]);
    loot(g);
    expect(cst(g, bors(g))).toBe(3);
    playId(g, LOOTER);
    need(g, 'choose', 'p1');
    pickInst(g, ids(g, BLUE).slice(0, 2));
    expect(g.zone('p1', 'trash').length).toBe(4);
    expect(cst(g, bors(g))).toBe(3);
  });

  it('a card trashed as an effect COST counts: EB03-025 [On Play] trash 1 from hand (accepted)', () => {
    const g = mainWith([BORS, COSTLY, BLUE]);
    playId(g, COSTLY);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, ids(g, BLUE).slice(0, 1));
    if (kind(g) === 'choose') none(g);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([BLUE]);
    expect(cst(g, bors(g))).toBe(3);
  });

  it('declining that optional cost trashes nothing: Borsalino stays at 6', () => {
    const g = mainWith([BORS, COSTLY, BLUE]);
    playId(g, COSTLY);
    answerOptional(g, false);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
    expect(cst(g, bors(g))).toBe(6);
  });

  it('the discount makes it affordable: 5 active DON!!, play a 2-cost looter, then Borsalino (cost 3) is playable', () => {
    const g = mainWith([BORS, LOOTER, BLUE], 5);
    expect(playable(g, bors(g))).toBe(false);
    loot(g);
    expect(dons(g).active).toBe(3);
    expect(playable(g, bors(g))).toBe(true);
    playRaw(g, bors(g));
    expect(dons(g).active).toBe(0);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([LOOTER, BORS]);
  });

  it('boundary: 4 DON!! after the looter is 2, so a cost-3 Borsalino is NOT playable with 4 DON!! total', () => {
    const g = mainWith([BORS, LOOTER, BLUE], 4);
    loot(g);
    expect(dons(g).active).toBe(2);
    expect(cst(g, bors(g))).toBe(3);
    expect(playable(g, bors(g))).toBe(false);
  });

  it('the opponent trashes a card from MY hand on their turn (OP09-087): cost 3 that turn, 6 again on my next turn', () => {
    const g = theirs(
      LD14.neutral,
      { hand: [BORS, BLUE, BLUE, BLUE, BLUE, BLUE], deck: Array.from({ length: 12 }, () => BLUE) },
      { hand: [FORCER] },
    );
    const b = bors(g);
    expect(cst(g, b)).toBe(6);
    playId(g, FORCER, 'p2');
    need(g, 'choose', 'p1');
    pickInst(g, ids(g, BLUE).slice(0, 1));
    expect(g.zone('p1', 'hand').length).toBe(5);
    expect(cst(g, b)).toBe(3);
    act(g, { type: 'endTurn' });
    // p1's turn: the discount belonged to the turn that ended.
    expect(pendingKind(g)).toBe('main');
    expect(cst(g, b)).toBe(6);
  });

  it('the discount ends with the turn: trashed on my turn, my next turn (after the opponent’s) has cost 6', () => {
    const g = mainWith([BORS, LOOTER, BLUE]);
    loot(g);
    expect(cst(g, bors(g))).toBe(3);
    toMyNextMain(g);
    expect(cst(g, bors(g))).toBe(6);
  });

  it('must not happen: trashing a card from the OPPONENT’s hand does not discount my Borsalino', () => {
    const g = mainWith([BORS, FORCER], 10, [BLUE, BLUE, BLUE, BLUE, BLUE]);
    playId(g, FORCER);
    need(g, 'choose', 'p2');
    pickInst(g, ids(g, BLUE, 'p2').slice(0, 1));
    expect(g.zone('p2', 'trash')).toHaveLength(1);
    expect(cst(g, bors(g))).toBe(6);
  });

  it('must not happen: playing a card from hand (not a trash) gives no discount', () => {
    const g = mainWith([BORS, BLUE]);
    playId(g, BLUE);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
    expect(cst(g, bors(g))).toBe(6);
  });

  it('must not happen: using an Event from hand as a Counter (it goes to the trash) gives no discount', () => {
    const g = theirs(
      LD14.neutral,
      {
        hand: [BORS, COUNTER_EVENT],
        deck: Array.from({ length: 12 }, () => BLUE),
        costArea: { active: 1, rested: 0 },
      },
      { characters: [SC14.c2] },
    );
    attack(g, at(g, 'p2', 'characters', SC14.c2), g.leader('p1'));
    if (pendingKind(g) === 'block') act(g, { type: 'block', blocker: null });
    need(g, 'counter', 'p1');
    activateCounter(g, ids(g, COUNTER_EVENT)[0]!);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(COUNTER_EVENT);
    expect(cst(g, bors(g))).toBe(6);
  });

  it('the discount is for the card IN HAND: a Borsalino on the field stays at cost 6, the one in hand gets 3', () => {
    const g = mine(LD14.neutral, {
      hand: [BORS, LOOTER, BLUE],
      characters: [BORS],
      deck: Array.from({ length: 12 }, () => BLUE),
      costArea: { active: 10, rested: 0 },
    });
    loot(g);
    expect(cst(g, ids(g, BORS)[0]!)).toBe(3);
    expect(cst(g, at(g, 'p1', 'characters', BORS))).toBe(6);
  });

  it('every Borsalino in hand is discounted, including when one of them is among the trashed cards', () => {
    const g = mainWith([BORS, BORS, LOOTER]);
    const [first, second] = ids(g, BORS) as [InstanceId, InstanceId];
    loot2(g, [first]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(BORS);
    expect(cst(g, second)).toBe(3);
  });

  it('Blocker: on the field Borsalino may block (the keyword is printed)', () => {
    const g = theirs(LD14.neutral, { characters: [BORS] }, { characters: [SC14.c2] });
    attack(g, at(g, 'p2', 'characters', SC14.c2), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', BORS)]);
  });
});

/** Play OP09-110 and trash `extra` plus one filler (so exactly two cards go). */
function loot2(g: ReturnType<typeof mine>, extra: InstanceId[]) {
  playId(g, LOOTER);
  need(g, 'choose', 'p1');
  pickInst(g, [...extra, ...ids(g, BLUE).slice(0, 2 - extra.length)]);
}
