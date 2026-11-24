/**
 * OP16-116 Zehahahahaha! (Event, Yellow, cost 8, {Blackbeard Pirates}/{The Seven Warlords of the Sea}).
 *
 * Card text: "[Main] If you have 10 DON!! cards on your field, play up to 1 [Marshall.D.Teach] from
 * your hand. Then, add up to 1 card from the top of your opponent's Life cards to the owner's hand.
 * [Trigger] Draw 2 cards and trash 1 card from your hand."
 *
 * Rules: CR 8-3-3 / RD 121-122 (text after a failed "if" does not resolve; a "then" after an
 * unresolvable clause that is NOT an "if" still does), CR 8-4-4-1 ("up to"), RD 104 (moving Life to
 * hand by an effect never activates [Trigger]), CR 6-5-5 (given DON!! are on the field).
 * Scenery: P-100 and OP09-093 are [Marshall.D.Teach] Characters (cost 10, no [On Play]).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  chars,
  declineTrigger,
  deck,
  deckOf,
  don,
  hand,
  hitLeader,
  kind,
  LD16,
  lifeCards,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playCard,
  SC16,
  SCN,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-op16c.ts';

const ID = 'OP16-116';
const TEACH = 'P-100';
const TEACH2 = 'OP09-093';

function main(
  o: {
    active?: number;
    handExtra?: string[];
    p2life?: string[];
    field?: (string | { card: string; don: number })[];
  } = {},
) {
  const g = mine(
    LD16.teach,
    {
      hand: [ID, ...(o.handExtra ?? [TEACH])],
      costArea: { active: o.active ?? 10, rested: 0 },
      characters: o.field ?? [],
    },
    { life: o.p2life ?? [SC16.wano3, BLUE, BLUE, BLUE] },
  );
  playCard(g, ID);
  return g;
}

describe("OP16-116 Zehahahahaha!: [Main] with 10 DON!! on my field play [Marshall.D.Teach] from hand, then add the top of the opponent's Life to their hand", () => {
  it("10 DON!! on the field: plays [Marshall.D.Teach] and the opponent's top Life card goes to their hand", () => {
    const g = main();
    need(g, 'choose', 'p1');
    pickCards(g, [TEACH]);
    yes(g, 'p1'); // "add up to 1 card from the top of the opponent's Life cards?"
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([TEACH]);
    expect(g.life('p2')).toBe(3);
    expect(hand(g, 'p2')).toEqual([SC16.wano3]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('the DON!! cost rests 8, but all 10 are still on the field (rested DON!! count)', () => {
    const g = main();
    pickCards(g, [TEACH]);
    expect(don(g).rested).toBe(8);
    expect(don(g).active + don(g).rested).toBe(10);
  });

  it('boundary: with only 9 DON!! on the field nothing happens, and the "Then" Life step does not resolve either', () => {
    const g = main({ active: 9 });
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([TEACH]);
    expect(g.life('p2')).toBe(4);
    expect(hand(g, 'p2')).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('DON!! given to my Characters count as on the field: 8 in the cost area + 2 given is 10', () => {
    const g = main({ active: 8, field: [{ card: SCN.c3, don: 2 }] });
    pickCards(g, [TEACH]);
    yes(g, 'p1');
    expect(chars(g).sort()).toEqual([SCN.c3, TEACH].sort());
    expect(g.life('p2')).toBe(3);
  });

  it('only a card named [Marshall.D.Teach] can be played (another Character in hand is not offered)', () => {
    const g = main({ handExtra: [TEACH, TEACH2, SCN.c4] });
    expect(offeredIds(g)).toEqual([TEACH, TEACH2].sort());
  });

  it('"up to 1": may play nothing; the "Then" Life step still resolves because the "if" held', () => {
    const g = main();
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    yes(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([TEACH]);
    expect(g.life('p2')).toBe(3);
    expect(hand(g, 'p2')).toEqual([SC16.wano3]);
  });

  it('with no [Marshall.D.Teach] in hand the play is skipped and the Life step still resolves', () => {
    const g = main({ handExtra: [SCN.c4] });
    if (kind(g) === 'choose') none(g);
    yes(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(g.life('p2')).toBe(3);
    expect(hand(g, 'p2')).toEqual([SC16.wano3]);
  });

  it('plays only one [Marshall.D.Teach] even with two in hand', () => {
    const g = main({ handExtra: [TEACH, TEACH2] });
    pickCards(g, [TEACH]);
    expect(chars(g)).toEqual([TEACH]);
    expect(hand(g)).toEqual([TEACH2]);
  });

  it('it is the TOP Life card that is taken, and a [Trigger] there does not activate (RD 104)', () => {
    const g = main({ p2life: ['OP01-104', BLUE, BLUE, BLUE] });
    pickCards(g, [TEACH]);
    yes(g, 'p1');
    expect(hand(g, 'p2')).toEqual(['OP01-104']);
    expect(lifeCards(g, 'p2')).toEqual([BLUE, BLUE, BLUE]);
    expect(chars(g, 'p2')).toEqual([]);
  });

  it('the Life step is "up to 1": if the opponent has no Life cards nothing is added', () => {
    const g = main({ p2life: [] });
    pickCards(g, [TEACH]);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('the played Teach is not given the Life step: Teach stays on the field', () => {
    const g = main();
    pickCards(g, [TEACH]);
    yes(g, 'p1');
    expect(chars(g)).toEqual([TEACH]);
  });
});

describe('OP16-116 Zehahahahaha!: [Trigger] draw 2 cards and trash 1 card from hand', () => {
  function hit(h: string[] = []) {
    const g = theirs(
      LD16.teach,
      { life: [ID, BLUE, BLUE, BLUE], hand: h, deck: deckOf([SCN.c1, SCN.c2]) },
      {},
    );
    hitLeader(g);
    return g;
  }

  it('activating draws 2, then trashes 1 card of my choice from the hand', () => {
    const g = hit([SCN.c3]);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c1]);
    expect(hand(g)).toEqual([SCN.c2, SCN.c3].sort());
    expect(trash(g)).toEqual([ID, SCN.c1].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('the trash is exactly 1 (not "up to"): it cannot be skipped', () => {
    const g = hit([]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(false);
  });

  it('declined: Zehahahahaha! goes to my hand and nothing is drawn', () => {
    const g = hit([]);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(deck(g)).toHaveLength(12);
  });
});
