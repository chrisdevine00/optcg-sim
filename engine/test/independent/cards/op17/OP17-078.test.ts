/**
 * OP17-078 Drunken Dragon Bagua (Event, Purple, cost 2, {The Four Emperors}/{Animal Kingdom Pirates}).
 *
 * Card text: "[Main] You may rest 2 of your DON!! cards and trash 2 cards from your hand: If your
 * Leader has the {Animal Kingdom Pirates} type, add up to 3 DON!! cards as rested from your DON!!
 * deck. [Counter] Up to 1 of your Leader or Characters gains +4000 power during this battle."
 *
 * Rules: CR 8-3-1 / 8-3-1-3 (all-or-nothing cost), CR 8-3-3 (failed "if"), CR 4-8-1 ("up to"),
 * CR 7-1-3-1-2 (Event [Counter]), RL-08 ("during this battle").
 */
import { describe, expect, it } from 'vitest';
import {
  activateCounter,
  at,
  atMain,
  attack,
  BLUE,
  choices,
  don,
  hand,
  kind,
  LD,
  mine,
  mayChooseNone,
  need,
  no,
  none,
  outcomes,
  passBlock,
  passCounter,
  payHand,
  pickCards,
  pickInst,
  playCard,
  SCN,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-op17b.ts';

const EVENT = 'OP17-078';

function main(leader: string, handExtra: string[], active = 4, donDeck?: number) {
  return mine(leader, {
    hand: [EVENT, ...handExtra],
    costArea: { active, rested: 0 },
    ...(donDeck !== undefined ? { donDeck } : {}),
  });
}

describe('OP17-078 Drunken Dragon Bagua [Main]', () => {
  it('AKP Leader: pays 2 DON!! and 2 cards, then adds 3 DON!! as RESTED from the DON!! deck', () => {
    const g = main(LD.akp, [SCN.c2, SCN.c3, BLUE]);
    playCard(g, EVENT);
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [SCN.c2, SCN.c3]);
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 0, rested: 7, deck: 3 });
    expect(trash(g)).toEqual([EVENT, SCN.c2, SCN.c3].sort());
    expect(hand(g)).toEqual([BLUE]);
  });

  it('a Leader without the {Animal Kingdom Pirates} type: the cost is paid but no DON!! is added', () => {
    const g = main(LD.neutral, [SCN.c2, SCN.c3]);
    playCard(g, EVENT);
    yes(g);
    payHand(g, [SCN.c2, SCN.c3]);
    expect(don(g)).toMatchObject({ active: 0, rested: 4, deck: 6 });
  });

  it("declining: nothing rested (beyond the Event's own cost), nothing trashed, no DON!! added", () => {
    const g = main(LD.akp, [SCN.c2, SCN.c3]);
    playCard(g, EVENT);
    no(g);
    expect(don(g)).toMatchObject({ active: 2, rested: 2, deck: 6 });
    expect(hand(g)).toEqual([SCN.c2, SCN.c3].sort());
    expect(trash(g)).toEqual([EVENT]);
  });

  it('CR 8-3-1-3: with 1 card in hand after the Event, the 2-card half of the cost cannot be paid, so nothing is paid at all', () => {
    const g = main(LD.akp, [SCN.c2]);
    playCard(g, EVENT);
    unusable(g, 'p1');
    expect(don(g)).toMatchObject({ active: 2, rested: 2, deck: 6 });
    expect(hand(g)).toEqual([SCN.c2]);
  });

  it("CR 8-3-1-3: with only 1 active DON!! left after the Event's cost, the 2-DON!! half cannot be paid", () => {
    const g = main(LD.akp, [SCN.c2, SCN.c3], 3);
    playCard(g, EVENT);
    unusable(g, 'p1');
    expect(hand(g)).toEqual([SCN.c2, SCN.c3].sort());
    expect(don(g)).toMatchObject({ active: 1, rested: 2 });
  });

  it('boundary: exactly 2 active DON!! left and exactly 2 cards in hand can pay', () => {
    const g = main(LD.akp, [SCN.c2, SCN.c3]);
    playCard(g, EVENT);
    expect(kind(g)).toBe('optional');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
  });

  it('the trash is exactly 2 cards of my choice', () => {
    const g = main(LD.akp, [SCN.c2, SCN.c3, BLUE]);
    playCard(g, EVENT);
    yes(g);
    need(g, 'choose');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('with only 2 DON!! left in the DON!! deck, 2 are added (as many as possible)', () => {
    const g = main(LD.akp, [SCN.c2, SCN.c3], 8, 2);
    playCard(g, EVENT);
    yes(g);
    payHand(g, [SCN.c2, SCN.c3]);
    expect(don(g)).toMatchObject({ active: 4, rested: 6, deck: 0 });
  });

  // Known, deliberate engine-wide choice (OPEN-QUESTIONS E-Q11): "add up to N DON!!" is always taken in full.
  it.fails('"up to 3": adding fewer DON!! (0 to 2) after paying is a reachable outcome', () => {
    const g = main(LD.akp, [SCN.c2, SCN.c3]);
    playCard(g, EVENT);
    yes(g);
    payHand(g, [SCN.c2, SCN.c3]);
    const added = outcomes(g, 'p1', (x) => String(don(x).rested));
    expect([...added].some((r) => Number(r) < 7)).toBe(true);
  });
});

describe('OP17-078 Drunken Dragon Bagua [Counter]', () => {
  function counterStep(chars: string[] = []) {
    const g = theirs(
      LD.akp,
      { hand: [EVENT], characters: chars, costArea: { active: 2, rested: 0 } },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('+4000 to my Leader during this battle only (5000 -> 9000), for 2 DON!!', () => {
    const g = counterStep();
    activateCounter(g, g.find('p1', 'hand', EVENT));
    need(g, 'choose');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(don(g)).toMatchObject({ active: 0, rested: 2 });
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('can boost a Character instead', () => {
    const g = counterStep([SCN.c3]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    pickCards(g, [SCN.c3]);
    expect(g.power(at(g, 'p1', 'characters', SCN.c3))).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": the target may be skipped', () => {
    const g = counterStep();
    activateCounter(g, g.find('p1', 'hand', EVENT));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(choices(g)).toEqual([]);
  });
});
