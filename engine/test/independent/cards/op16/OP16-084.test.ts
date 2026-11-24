/**
 * OP16-084 Kouzuki Momonosuke (Character, Black, cost 5, 0 power, Counter +2000, {Land of Wano}/{Kouzuki Clan}).
 *
 * Card text: "[Activate: Main] You may trash this Character with a cost of 20 or more: If you have 9 or
 * more DON!! cards on your field, play up to 1 [Kouzuki Momonosuke] with a cost of 9 from your trash."
 *
 * The printed cost is 5, so the +20 needed comes from OP16-087 Shinobu ("up to 1 of your [Kouzuki
 * Momonosuke] gains +20 cost during this turn"), played first in the same turn.
 *
 * Rules: CR 8-3-1-3 (a cost that cannot be paid cannot be paid), CR 8-4-4-1 ("up to"), RD 122
 * (a failed "If" ends the effect, the cost stays paid), CR 10-2-13 (DON!! on the field includes
 * given DON!!).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  chars,
  deckOf,
  don,
  kind,
  LD16,
  need,
  none,
  offeredAbilities,
  offeredIds,
  p1main,
  pickCards,
  playIt,
  SC16,
  toMyNextMain,
  trash,
  useAbility,
  yes,
  mayChooseNone,
  canAttackAnything,
} from './kit-op16c.ts';

const ID = 'OP16-084';
const SHINOBU = 'OP16-087';
const BIG_MOMO = 'OP16-085'; // [Kouzuki Momonosuke], cost 9

/** The played [Kouzuki Momonosuke] (OP16-085) has its own [On Play]; it is not under test here: take nothing. */
function declineOnPlay(g: ReturnType<typeof p1main>) {
  if (kind(g) === 'choose') none(g);
}

/** Board with Momonosuke (84) on the field, Shinobu in hand; Shinobu is played and pays +20 onto it. */
function boosted(o: { active?: number; rested?: number; trash?: string[]; momoDon?: number } = {}) {
  const g = p1main(LD16.wano, {
    hand: [SHINOBU],
    characters: [{ card: ID, don: o.momoDon ?? 0 }],
    trash: o.trash ?? [BIG_MOMO],
    deck: deckOf([SC16.wano3]),
    costArea: { active: o.active ?? 8, rested: o.rested ?? 2 },
  });
  playIt(g, SHINOBU);
  yes(g, 'p1');
  pickCards(g, [ID]);
  return g;
}

describe('OP16-084 Kouzuki Momonosuke: [Activate: Main] trash this (cost 20+): play [Kouzuki Momonosuke] cost 9 from the trash', () => {
  it('with the cost raised to 25 and 10 DON!! on the field: trashes itself and plays the cost-9 [Kouzuki Momonosuke]', () => {
    const g = boosted();
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(25);
    useAbility(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    pickCards(g, [BIG_MOMO]);
    declineOnPlay(g);
    expect(chars(g)).toEqual([BIG_MOMO]);
    expect(trash(g)).toEqual([ID, SHINOBU].sort());
  });

  it('cost boundary: at its printed cost 5 the ability is not usable (nothing is trashed)', () => {
    const g = p1main(LD16.wano, { characters: [ID], trash: [BIG_MOMO] });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
    expect(atMain(g)).toBe(true);
  });

  it('the +20 is needed this turn only: next turn the ability is not offered again', () => {
    const g = boosted({ trash: [] });
    toMyNextMain(g);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('DON!! boundary: 9 DON!! on the field plays the Character, 8 does not (the cost is still paid)', () => {
    const nine = boosted({ active: 7, rested: 2 });
    useAbility(nine, at(nine, 'p1', 'characters', ID));
    // Shinobu cost 2 rested two DON!!; 9 are on the field in total
    expect(don(nine).active + don(nine).rested).toBe(9);
    need(nine, 'choose', 'p1');
    pickCards(nine, [BIG_MOMO]);
    declineOnPlay(nine);
    expect(chars(nine)).toEqual([BIG_MOMO]);

    const eight = boosted({ active: 6, rested: 2 });
    useAbility(eight, at(eight, 'p1', 'characters', ID));
    if (kind(eight) === 'choose') {
      expect(offeredIds(eight)).toEqual([]);
      none(eight);
    }
    expect(atMain(eight)).toBe(true);
    expect(chars(eight)).toEqual([]);
    expect(trash(eight)).toEqual([BIG_MOMO, ID, SHINOBU].sort());
  });

  it('DON!! given to Characters count as DON!! on the field: 7 in the cost area + 2 given is 9', () => {
    const g = p1main(LD16.wano, {
      hand: [SHINOBU],
      characters: [{ card: ID, don: 2 }],
      trash: [BIG_MOMO],
      costArea: { active: 5, rested: 2 },
    });
    playIt(g, SHINOBU);
    yes(g, 'p1');
    pickCards(g, [ID]);
    useAbility(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BIG_MOMO]);
  });

  it('only a [Kouzuki Momonosuke] with cost 9 is a candidate (not cost 2, cost 6, nor the trashed cost-5 one)', () => {
    const g = boosted({ trash: [SC16.momo2, SC16.momo6, BIG_MOMO, SC16.wano8] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    expect(offeredIds(g)).toEqual([BIG_MOMO]);
  });

  it('"up to 1": may play nothing (the card is already trashed as the cost)', () => {
    const g = boosted();
    useAbility(g, at(g, 'p1', 'characters', ID));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toContain(ID);
  });

  it('with no cost-9 [Kouzuki Momonosuke] in the trash nothing is played', () => {
    const g = boosted({ trash: [SC16.momo6] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(chars(g)).toEqual([]);
  });

  it('the Character played this way has just been played: it cannot attack this turn', () => {
    const g = boosted();
    useAbility(g, at(g, 'p1', 'characters', ID));
    pickCards(g, [BIG_MOMO]);
    declineOnPlay(g);
    expect(canAttackAnything(g, at(g, 'p1', 'characters', BIG_MOMO))).toBe(false);
  });
});
