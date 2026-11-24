/**
 * OP17-038 I Think He's Seen an Ugly Future... (Event, Green, cost 0, {Red-Haired Pirates}).
 *
 * Card text: "[Main] You may rest 4 of your cards: Rest up to 1 of your opponent's Characters.
 * [Counter] You may trash 1 card from your hand: Up to 1 of your Leader or Characters gains
 * +3000 power during this battle."
 *
 * Rules: CR 8-3-1 / 8-3-1-3 (all-or-nothing cost), M4b-1 / E-Q3 (a "card" to rest may be DON!!),
 * CR 7-1-3-1-2 (Event [Counter]; the Event leaves the hand when activated), RL-08.
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
  fill,
  hand,
  LD,
  mine,
  need,
  no,
  none,
  offeredIds,
  passBlock,
  passCounter,
  payHand,
  pickCards,
  pickInst,
  playCard,
  restCost,
  SCN,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-op17b.ts';

const EVENT = 'OP17-038';

function main(active: number, mineChars: string[] = [], opp: string[] = [SCN.c4]) {
  return mine(
    LD.rhp,
    { hand: [EVENT], costArea: { active, rested: 0 }, characters: mineChars },
    { characters: opp },
  );
}

describe('OP17-038 [Main] rest 4 of your cards: rest up to 1 opposing Character', () => {
  it('rests 4 DON!! and then the chosen opposing Character; the Event costs 0 DON!!', () => {
    const g = main(6);
    playCard(g, EVENT);
    yes(g);
    restCost(g, [], 4);
    need(g, 'choose');
    pickCards(g, [SCN.c4]);
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 2, rested: 4 });
    expect(g.card(at(g, 'p2', 'characters', SCN.c4)).rested).toBe(true);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('"cards" includes the Leader and Characters: the cost can be paid by resting them', () => {
    const g = main(2, [SCN.c2, SCN.c3]);
    playCard(g, EVENT);
    yes(g);
    const c2 = at(g, 'p1', 'characters', SCN.c2);
    const c3 = at(g, 'p1', 'characters', SCN.c3);
    restCost(g, [g.leader('p1'), c2, c3], 1);
    pickCards(g, [SCN.c4]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(g.card(c2).rested).toBe(true);
    expect(g.card(c3).rested).toBe(true);
    expect(don(g)).toMatchObject({ active: 1, rested: 1 });
    expect(g.card(at(g, 'p2', 'characters', SCN.c4)).rested).toBe(true);
  });

  it('boundary: exactly 4 active cards can pay (3 DON!! + Leader), 3 active cards cannot', () => {
    const ok = main(3);
    playCard(ok, EVENT);
    expect(['optional']).toContain(need(ok, 'optional').kind);
    expect(ok.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
    const bad = main(2);
    // 2 DON!! + Leader = 3 cards
    playCard(bad, EVENT);
    unusable(bad, 'p1');
    expect(bad.card(at(bad, 'p2', 'characters', SCN.c4)).rested).toBe(false);
    expect(don(bad)).toMatchObject({ active: 2, rested: 0 });
  });

  it('declining the cost: nothing is rested; the Event is still played', () => {
    const g = main(6);
    playCard(g, EVENT);
    no(g);
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 6, rested: 0 });
    expect(g.card(at(g, 'p2', 'characters', SCN.c4)).rested).toBe(false);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('"up to 1": the target may be skipped after the cost is paid (the cost stays paid)', () => {
    const g = main(6);
    playCard(g, EVENT);
    yes(g);
    restCost(g, [], 4);
    none(g);
    expect(don(g)).toMatchObject({ active: 2, rested: 4 });
    expect(g.card(at(g, 'p2', 'characters', SCN.c4)).rested).toBe(false);
  });

  it('targets are opposing Characters only: no cost limit, not the Leader, not my own', () => {
    const g = main(6, [SCN.c1], [SCN.c10, SCN.c2]);
    playCard(g, EVENT);
    yes(g);
    restCost(g, [], 4);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SCN.c10, SCN.c2].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
  });
});

describe('OP17-038 [Counter] trash 1 card from your hand: +3000', () => {
  function counterStep(handExtra: string[], chars: string[] = []) {
    const g = theirs(
      LD.rhp,
      { hand: [EVENT, ...handExtra], costArea: { active: 0, rested: 0 }, characters: chars },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('trashing 1 other card gives the Leader +3000 during this battle only', () => {
    const g = counterStep([BLUE, SCN.c5]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    yes(g);
    payHand(g, [SCN.c5]);
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(hand(g)).toEqual([BLUE]);
    expect(trash(g)).toEqual([EVENT, SCN.c5].sort());
    passCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Character can receive the boost', () => {
    const g = counterStep([BLUE], [SCN.c3]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    yes(g);
    payHand(g, [BLUE]);
    pickCards(g, [SCN.c3]);
    expect(g.power(at(g, 'p1', 'characters', SCN.c3))).toBe(8000);
  });

  it('declining the trash: nothing is trashed (apart from the Event) and there is no boost', () => {
    const g = counterStep([BLUE]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    no(g);
    expect(hand(g)).toEqual([BLUE]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-1-3: with no other card in hand (the Event itself has left), the cost cannot be paid', () => {
    const g = counterStep([]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    unusable(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('"up to 1": after trashing, choosing no target is allowed; the card stays trashed', () => {
    const g = counterStep([BLUE]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    yes(g);
    payHand(g, [BLUE]);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).toEqual([]);
    void fill;
  });
});
