/**
 * OP14-110 Dr. Hogback (Character, Yellow, cost 4, 5000, Counter +1000, {Thriller Bark Pirates}).
 *
 * Card text: "[On K.O.] Play up to 1 Character card with a cost of 4 or less and a [Trigger] other than
 * [Dr. Hogback] from your trash.
 * [Trigger] Play up to 1 {Thriller Bark Pirates} type Character card with a cost of 4 or less from
 * your trash rested."
 *
 * Rules: CR 10-2-17 ([On K.O.] resolves from the trash, so Hogback itself is in the trash), CR
 * 8-4-4 ("up to"). The played Character is not rested (the text does not say rested).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  BLUE,
  chars,
  describeTbTrigger,
  hand,
  kind,
  LD14,
  need,
  none,
  offeredIds,
  pickCards,
  reachablePickSets,
  SC14,
  skipEmptyChoose,
  theirs,
  theyKo,
  trash,
} from './kit-op14d.ts';

const ID = 'OP14-110';
/** Characters with a [Trigger]: OP17-107 Daifuku (cost 3), OP14-102 Kumacy (cost 1), OP16-113 Marigold (cost 5). */
const DAIFUKU = SC14.daifuku3;
const KUMACY = 'OP14-102';

function koed(o: { trash?: string[]; hand?: string[]; p2trash?: string[] } = {}) {
  const g = theirs(
    LD14.neutral,
    {
      characters: [{ card: ID, rested: true }],
      trash: o.trash ?? [],
      hand: o.hand ?? [],
    },
    { trash: o.p2trash ?? [] },
  );
  theyKo(g, at(g, 'p1', 'characters', ID));
  return g;
}

describe('OP14-110 Dr. Hogback: [On K.O.] play a cost-4-or-less Character with a [Trigger] (not Hogback) from the trash', () => {
  it('offers exactly the Characters of cost 4 or less that have a [Trigger]', () => {
    const g = koed({ trash: [DAIFUKU, KUMACY, SC14.c2, SC14.c4, SC14.marigold5] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([DAIFUKU, KUMACY].sort());
  });

  it('cost boundary: a cost-5 Character with a [Trigger] is not offered', () => {
    const g = koed({ trash: [SC14.marigold5] });
    skipEmptyChoose(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID, SC14.marigold5].sort());
  });

  it('the chosen Character enters play ACTIVE (not rested) and leaves the trash; its [Trigger] does not fire', () => {
    const g = koed({ trash: [DAIFUKU, KUMACY] });
    pickCards(g, [DAIFUKU]);
    expect(atMain(g, 'p2')).toBe(true);
    const c = g.zone('p1', 'characters');
    expect(c.map((x) => x.card)).toEqual([DAIFUKU]);
    expect(c[0]!.rested).toBe(false);
    expect(trash(g)).toEqual([ID, KUMACY].sort());
  });

  it('"other than [Dr. Hogback]": the K.O.d Hogback itself and a second copy are not offered though they have a [Trigger] and cost 4', () => {
    const g = koed({ trash: [ID, DAIFUKU] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([DAIFUKU]);
  });

  it('with only Hogback cards in the trash nothing can be played', () => {
    const g = koed({ trash: [ID] });
    skipEmptyChoose(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID, ID]);
  });

  it('a Character without a [Trigger] is not offered even at a legal cost', () => {
    const g = koed({ trash: [SC14.c2, SC14.c4] });
    skipEmptyChoose(g);
    expect(chars(g)).toEqual([]);
  });

  it('"up to 1": may play nothing; and at most one is ever played', () => {
    const g = koed({ trash: [DAIFUKU, KUMACY] });
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    none(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID, DAIFUKU, KUMACY].sort());
  });

  it("only from my trash: hand cards and the opponent's trash are not candidates", () => {
    const g = koed({ trash: [KUMACY], hand: [DAIFUKU], p2trash: [DAIFUKU] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KUMACY]);
    expect(hand(g)).toEqual([DAIFUKU]);
    expect(kind(g)).toBe('choose');
    expect(BLUE).toBeTruthy();
  });
});

describeTbTrigger(ID);
