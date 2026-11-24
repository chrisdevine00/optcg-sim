/**
 * OP17-066 Kurozumi Orochi (Character, Purple, cost 1, 0, Counter +1000, {Land of Wano}/{Kurozumi Clan}).
 *
 * Card text: "[On Play] DON!! −1: If you have a Character with a cost of 10 or more, draw 2 cards and
 * trash 1 card from your hand."
 *
 * Rules: CR 8-3-1-6 / RD 86 (DON!! −X returns DON!! to the DON!! deck; any DON!! on the field),
 * RD 112 (an [On Play] with a cost may be declined), CR 8-3-3 (text after a failed "if" does not
 * resolve), CR 1-3-6-2 (cost as modified), CR 4-5-3 (draw X).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  BLUE,
  deck,
  don,
  fill,
  hand,
  kind,
  LD,
  mine,
  n,
  need,
  no,
  offeredIds,
  payDonStrict,
  pickCards,
  playCard,
  SCN,
  trash,
  yes,
  at,
} from './kit-op17b.ts';

const OROCHI = 'OP17-066';

/** Orochi in hand, 1 active DON!! (so exactly one DON!! class exists after the play cost). */
function play(chars: (string | { card: string; rested?: boolean })[], handExtra: string[] = []) {
  const g = mine(
    LD.akp,
    {
      hand: [OROCHI, ...handExtra],
      characters: chars,
      costArea: { active: 1, rested: 0 },
      deck: [SCN.c2, SCN.c3, ...fill(BLUE, 13)],
    },
    {},
  );
  playCard(g, OROCHI);
  return g;
}

describe('OP17-066 Kurozumi Orochi: [On Play] DON!! −1: if you have a cost 10+ Character, draw 2 and trash 1', () => {
  it('with a cost-10 Character: returns 1 DON!! to the DON!! deck, draws 2, trashes 1 card of my choice', () => {
    const g = play([SCN.c10]);
    need(g, 'optional', 'p1');
    yes(g);
    expect(don(g)).toMatchObject({ active: 0, rested: 0, deck: 10 });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c2, SCN.c3].sort());
    pickCards(g, [SCN.c3]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCN.c2]);
    expect(trash(g)).toEqual([SCN.c3]);
    expect(deck(g)).toHaveLength(13);
  });

  it('boundary: a cost-9 Character does not satisfy "10 or more"', () => {
    const g = play([SCN.c9]);
    if (kind(g) === 'optional') yes(g);
    expect(hand(g)).toEqual([]);
    expect(n(g, 'p1', 'deck')).toBe(15);
    expect(atMain(g)).toBe(true);
  });

  it('the Character may be a current cost of 10+ made by an effect (Dorry is cost 5 +12)', () => {
    const g = play(['OP17-085']);
    yes(g);
    pickCards(g, [SCN.c2]);
    expect(hand(g)).toHaveLength(1);
  });

  it('only MY Characters count: an opposing cost-10 Character does not satisfy the condition', () => {
    const g = mine(
      LD.akp,
      { hand: [OROCHI], costArea: { active: 1, rested: 0 } },
      { characters: [SCN.c10] },
    );
    playCard(g, OROCHI);
    if (kind(g) === 'optional') yes(g);
    expect(hand(g)).toEqual([]);
    expect(n(g, 'p1', 'deck')).toBe(15);
  });

  it('with no such Character nothing is drawn or trashed (the text after the failed "if" does not resolve)', () => {
    const g = play([SCN.c5]);
    if (kind(g) === 'optional') yes(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
  });

  it('declining the DON!! −1: no DON!! returned, no draw', () => {
    const g = play([SCN.c10]);
    no(g);
    expect(don(g)).toMatchObject({ active: 0, rested: 1 });
    expect(hand(g)).toEqual([]);
    expect(atMain(g)).toBe(true);
  });

  it('the trash is exactly 1 card, not optional', () => {
    const g = play([SCN.c10]);
    yes(g);
    need(g, 'choose');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('the card in hand before the play is part of the choice: the trash may take a card that was already held', () => {
    const g = play([SCN.c10], [SCN.c4]);
    yes(g);
    expect(offeredIds(g)).toEqual([SCN.c2, SCN.c3, SCN.c4].sort());
    pickCards(g, [SCN.c4]);
    expect(hand(g)).toEqual([SCN.c2, SCN.c3].sort());
  });

  it('DON!! −1 may return a rested DON!! or an active one: with both on the field the player chooses', () => {
    const g = mine(
      LD.akp,
      { hand: [OROCHI], characters: [SCN.c10], costArea: { active: 3, rested: 0 } },
      {},
    );
    playCard(g, OROCHI);
    yes(g);
    payDonStrict(g, 1, 'costRested');
    expect(don(g)).toMatchObject({ active: 2, rested: 0 });
    void at;
  });
});
