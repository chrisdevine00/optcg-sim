/**
 * OP17-036 Withdraw Now and Allow Me to Save Face (Event, Green, cost 1, {The Four Emperors}/{Red-Haired Pirates}).
 *
 * Card text: "[Main] You may rest 6 of your DON!! cards: Rest up to 1 of your opponent's Characters.
 * Then, K.O. up to 2 of your opponent's rested Characters with a cost of 6 or less.
 * [Counter] Up to 1 of your [Shanks] gains +4000 power during this battle."
 *
 * Rules: CR 8-3-1 (cost: all or nothing, CR 8-3-1-3), CR 8-4-4-1 ("up to"), CR 4-10 ("Then"),
 * CR 2-1-2 ([Name] is an exact name), CR 7-1-3-1-2 (Event [Counter]), RL-08 ("during this battle").
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  atMain,
  choices,
  don,
  LD,
  mine,
  n,
  need,
  no,
  none,
  offeredIds,
  passBlock,
  pickCards,
  playCard,
  SCN,
  theirs,
  trash,
  unusable,
  yes,
  act,
  mayChooseNone,
  passCounter,
} from './kit-op17b.ts';

const EVENT = 'OP17-036';
const SHANKS_CHAR = 'P-016'; // Red, cost 8, 10000, [Shanks] Character
const R = (card: string) => ({ card, rested: true });

/** My Main Phase with the Event in hand and `active` DON!! (default 10). */
function main(opp: Parameters<typeof mine>[2], active = 10, mineChars: string[] = []) {
  return mine(
    LD.rhp,
    { hand: [EVENT], costArea: { active, rested: 0 }, characters: mineChars },
    opp,
  );
}

describe('OP17-036 Withdraw Now and Allow Me to Save Face', () => {
  it('[Main]: pays 6 DON!! on top of the 1 DON!! play cost, rests a Character, then K.O.s rested ones (including the one just rested)', () => {
    const g = main({ characters: [SCN.c4] });
    playCard(g, EVENT);
    yes(g);
    expect(don(g)).toMatchObject({ active: 3, rested: 7 });
    pickCards(g, [SCN.c4]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SCN.c4]);
    pickCards(g, [SCN.c4]);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(trash(g, 'p2')).toEqual([SCN.c4]);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('K.O. step: "up to 2": two rested cost-6-or-less Characters can be K.O.\'d, and one or none is allowed', () => {
    const g = main({ characters: [R(SCN.c3), R(SCN.c6), R(SCN.c2)] });
    playCard(g, EVENT);
    yes(g);
    none(g); // rest nothing
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SCN.c2, SCN.c3, SCN.c6].sort());
    pickCards(g, [SCN.c3, SCN.c6]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(trash(g, 'p2')).toEqual([SCN.c3, SCN.c6].sort());
  });

  it('K.O. step: choosing only one, or none, is allowed', () => {
    const g = main({ characters: [R(SCN.c3), R(SCN.c2)] });
    playCard(g, EVENT);
    yes(g);
    none(g);
    expect(mayChooseNone(g)).toBe(true);
    pickCards(g, [SCN.c2]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    const h = main({ characters: [R(SCN.c3)] });
    playCard(h, EVENT);
    yes(h);
    none(h);
    none(h);
    expect(h.zone('p2', 'characters')).toHaveLength(1);
  });

  it('boundary: a rested cost-6 Character is a K.O. candidate, a rested cost-7 Character is not', () => {
    const g = main({ characters: [R(SCN.c6), R(SCN.c7)] });
    playCard(g, EVENT);
    yes(g);
    none(g);
    expect(offeredIds(g)).toEqual([SCN.c6]);
  });

  it('the cost limit reads the CURRENT cost: a rested cost-7 Character reduced to 6 this turn is a K.O. candidate', () => {
    const g = mine(
      LD.rhp,
      { hand: ['OP17-097', EVENT], costArea: { active: 10, rested: 0 } },
      { characters: [R(SCN.c7)] },
    );
    act(g, { type: 'playCard', card: g.find('p1', 'hand', 'OP17-097') });
    expect(g.card(at(g, 'p2', 'characters', SCN.c7)).cost).toBe(6);
    playCard(g, EVENT);
    yes(g);
    none(g);
    expect(offeredIds(g)).toEqual([SCN.c7]);
  });

  it('K.O. step: only RESTED opposing Characters (an active one is not a candidate), never my own', () => {
    const g = main({ characters: [SCN.c3, R(SCN.c2)] }, 10, [SCN.c1]);
    playCard(g, EVENT);
    yes(g);
    none(g);
    expect(offeredIds(g)).toEqual([SCN.c2]);
  });

  it("the Character rested by this very effect can then be K.O.'d (rest first, K.O. second)", () => {
    const g = main({ characters: [SCN.c3] });
    playCard(g, EVENT);
    yes(g);
    pickCards(g, [SCN.c3]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SCN.c3]);
  });

  it("declining the cost: nothing is rested, nothing K.O.'d, no DON!! spent except the play cost; the Event is still trashed", () => {
    const g = main({ characters: [R(SCN.c3)] });
    playCard(g, EVENT);
    no(g);
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('cost: with only 6 active DON!! the 1 DON!! play cost leaves 5, so the 6-DON!! cost cannot be paid (CR 8-3-1-3)', () => {
    const g = main({ characters: [R(SCN.c3)] }, 6);
    playCard(g, EVENT);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(don(g)).toMatchObject({ active: 5, rested: 1 });
  });

  it('rest step: "up to 1" - candidates are the opposing Characters and nothing else', () => {
    const g = main({ characters: [SCN.c4, SCN.c8] }, 10, [SCN.c2]);
    playCard(g, EVENT);
    yes(g);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SCN.c4, SCN.c8].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('[Counter]: +4000 to my [Shanks] Leader during this battle only', () => {
    const g = theirs(LD.rhp, { hand: [EVENT], costArea: { active: 3, rested: 0 } }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    const ev = g.find('p1', 'hand', EVENT);
    act(g, {
      type: 'activate',
      card: ev,
      ability: g
        .legal()
        .flatMap((a) => (a.type === 'activate' && a.card === ev ? [a.ability] : []))[0]!,
    });
    need(g, 'choose');
    pickCards(g, ['ST05-001']);
    expect(g.power(g.leader('p1'))).toBe(9000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(n(g, 'p1', 'trash')).toBe(1);
  });

  it('[Counter]: only a card NAMED [Shanks] is a target: a Shanks Character yes, other Characters no', () => {
    const g = theirs(
      LD.neutral,
      { hand: [EVENT], characters: [SHANKS_CHAR, SCN.c2], costArea: { active: 3, rested: 0 } },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    const ev = g.find('p1', 'hand', EVENT);
    const a = g
      .legal()
      .find((x) => (x.type === 'activate' || x.type === 'counter') && x.card === ev);
    expect(a).toBeDefined();
    g.act(a!);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SHANKS_CHAR]);
    expect(choices(g)).not.toContain(g.leader('p1'));
  });
});
