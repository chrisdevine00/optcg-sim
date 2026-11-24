/**
 * OP16-045 Crocodile (Character, Blue, cost 4, 6000, no Counter, {Impel Down}/{Former Baroque Works}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] You may return 1 of your Characters with a cost of 2 or more to the
 * owner's hand: Play up to 1 {Impel Down} type Character card with a cost of 2 or less from your
 * hand."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 8-3-1 (cost), RD 112 (optional cost on [On Play]), CR 8-4-4-1
 * ("up to"), CR 3-7-6 (Character limit of 5), RL-12 (an effect outlives its source).
 */
import { describe, expect, it } from 'vitest';
import { blockers, attack } from '../../helpers.ts';
import {
  answerMay,
  at,
  backAtMain,
  declineChoice,
  hand,
  ID,
  inst,
  kind,
  LDR,
  mine,
  mustBeUnpayable,
  need,
  offeredNow,
  payCost,
  pickInst,
  put,
  SCN,
  theirs,
} from './kit-op16b.ts';

const CROC = 'OP16-045';
/** OP16-044 Emporio.Ivankov: cost 2, 2000, [Blocker], {Impel Down}. Playable by the effect (cost 2). */
const IVAN = 'OP16-044';

/** Play Crocodile and accept the cost; the engine then asks which Character to return. */
function payByReturning(g: ReturnType<typeof mine>, which: string) {
  put(g, CROC);
  answerMay(g, true);
  need(g, 'choose', 'p1');
  payCost(g, which);
}

describe('OP16-045 Crocodile: [Blocker]; [On Play] return a Character with cost 2+: play an {Impel Down} Character with cost 2 or less from hand', () => {
  it('has [Blocker] and blocks an attack on the Leader', () => {
    const g = theirs(LDR.luffy, { characters: [CROC] }, { characters: [SCN.c3] });
    expect(g.card(inst(g, 'p1', 'characters', CROC)).keywords).toContain('Blocker');
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([inst(g, 'p1', 'characters', CROC)]);
  });

  it('returns a Character with cost 2+ to hand, then plays a cost-2 {Impel Down} Character from hand', () => {
    const g = mine(LDR.impel, { hand: [CROC, IVAN], characters: [SCN.c3] });
    const target = inst(g, 'p1', 'characters', SCN.c3);
    payByReturning(g, target);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', IVAN)]);
    expect(backAtMain(g)).toBe(true);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([CROC, IVAN].sort());
    expect(hand(g)).toEqual([SCN.c3]);
  });

  it('cost boundary of the returned Character: a cost-1 Character is not offered, a cost-2 one is', () => {
    const g = mine(LDR.impel, { hand: [CROC, IVAN], characters: [SCN.c1, SCN.c2] });
    put(g, CROC);
    answerMay(g, true);
    need(g, 'choose', 'p1');
    const offered = offeredNow(g);
    expect(offered).toContain(SCN.c2);
    expect(offered).not.toContain(SCN.c1);
  });

  it('the played Character must be {Impel Down}, cost 2 or less: offered are cost 1 and 2 only', () => {
    const g = mine(LDR.impel, {
      hand: [CROC, ID.blugori, IVAN, ID.sphinx, SCN.c1],
      characters: [SCN.c3],
    });
    payByReturning(g, inst(g, 'p1', 'characters', SCN.c3));
    need(g, 'choose', 'p1');
    // cost 1 {Impel Down} (Blugori) and cost 2 (Ivankov) yes; cost 4 Sphinx, the returned cost-3 Character and a non-{Impel Down} no
    expect(offeredNow(g)).toEqual([ID.blugori, IVAN].sort());
  });

  it('"up to 1": after paying, may play nothing', () => {
    const g = mine(LDR.impel, { hand: [CROC, IVAN], characters: [SCN.c3] });
    payByReturning(g, inst(g, 'p1', 'characters', SCN.c3));
    declineChoice(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([CROC]);
    expect(hand(g)).toEqual([SCN.c3, IVAN].sort());
  });

  it('declining the optional cost: nothing is returned and nothing is played', () => {
    const g = mine(LDR.impel, { hand: [CROC, IVAN], characters: [SCN.c3] });
    put(g, CROC);
    answerMay(g, false);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([CROC, SCN.c3].sort());
    expect(hand(g)).toEqual([IVAN]);
  });

  it('Crocodile itself is one of my Characters (cost 4): it may return itself and the play still resolves', () => {
    const g = mine(LDR.impel, { hand: [CROC, IVAN] });
    put(g, CROC);
    answerMay(g, true);
    // Crocodile is the only candidate: the engine may pick it by itself or ask.
    payCost(g);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', IVAN)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([IVAN]);
    expect(hand(g)).toEqual([CROC]);
  });

  it('the cost may be paid with nothing to play: the Character is returned and nothing happens next', () => {
    const g = mine(LDR.impel, { hand: [CROC], characters: [SCN.c3] });
    payByReturning(g, inst(g, 'p1', 'characters', SCN.c3));
    if (kind(g) === 'choose') declineChoice(g);
    expect(backAtMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCN.c3]);
  });

  it('with 5 Characters in play, returning one first makes room: no Character-limit trash is asked', () => {
    const g = mine(LDR.impel, {
      hand: [CROC, IVAN],
      characters: [SCN.c2, SCN.c3, SCN.c4, SCN.c5],
    });
    payByReturning(g, inst(g, 'p1', 'characters', SCN.c5));
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', IVAN)]);
    expect(backAtMain(g)).toBe(true);
    expect(g.zone('p1', 'characters')).toHaveLength(5);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
    void at;
  });

  it('must-not-happen: with only a cost-1 Character besides itself, the cost-1 Character is never the one returned', () => {
    const g = mine(LDR.impel, { hand: [CROC], characters: [SCN.c1] });
    put(g, CROC);
    answerMay(g, true);
    payCost(g);
    if (kind(g) === 'choose') declineChoice(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([SCN.c1]);
    expect(hand(g)).toEqual([CROC]);
    void mustBeUnpayable;
  });
});
