/**
 * OP16-105 Gecko Moria (Character, Yellow, cost 6, 7000, Counter +1000, {The Seven Warlords of the Sea}/{Thriller Bark Pirates}).
 *
 * Card text: "[Trigger] If you have 1 or less Life cards, play up to 1 [Absalom], up to 1 [Dr. Hogback],
 * and up to 1 [Perona], with a cost of 4 or less from your trash."
 *
 * Rules: RD 101-102 (while a [Trigger] resolves the card is in no area, and the Life card taken is
 * already out of the Life count), CR 8-4-4-1 ("up to"), CR 3-7-6 (five Character areas).
 * Scenery in the trash: OP06-081 Absalom (4), OP14-100 Absalom (3), OP06-090 Dr. Hogback (4),
 * ST12-005 Perona (4), OP14-033 Perona (5), OP15-090 Perona (1).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  BLUE,
  chars,
  decision,
  declineTrigger,
  hand,
  hitLeader,
  kind,
  LD16,
  mayChooseNone,
  need,
  none,
  offeredIds,
  pickCards,
  SC16,
  SCN,
  theirs,
  trash,
} from './kit-op16c.ts';

const ID = 'OP16-105';
const ABS4 = 'OP06-081';
const ABS3 = 'OP14-100';
const HOG4 = 'OP06-090';
const PER4 = 'ST12-005';
const PER5 = 'OP14-033';

/** Moria is the top Life card; `rest` more Life cards below it. p2's Leader hits mine. */
function hit(rest: number, tr: string[], field: string[] = []) {
  const g = theirs(
    LD16.wano,
    { life: [ID, ...Array.from({ length: rest }, () => BLUE)], trash: tr, characters: field },
    {},
  );
  hitLeader(g);
  return g;
}

/** Answer the three "up to 1" questions in order with the named cards (null = nothing). */
function playAll(g: ReturnType<typeof hit>, picks: (string | null)[]) {
  for (const p of picks) {
    if (kind(g) !== 'choose') break;
    if (p === null) none(g);
    else pickCards(g, [p]);
  }
}

describe('OP16-105 Gecko Moria: [Trigger] with 1 or less Life, play [Absalom], [Dr. Hogback] and [Perona] (cost 4 or less) from the trash', () => {
  it('plays one of each named Character from the trash', () => {
    const g = hit(0, [ABS4, HOG4, PER4]);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    // The three plays may be asked in any order; each offers only its own name.
    const seen: string[] = [];
    for (let i = 0; i < 3 && kind(g) === 'choose'; i++) {
      const ids = offeredIds(g);
      seen.push(...(ids as string[]));
      pickCards(g, [ids[0] as string]);
    }
    expect(chars(g).sort()).toEqual([ABS4, HOG4, PER4].sort());
    expect(trash(g)).toEqual([ID]);
    expect(seen.sort()).toEqual([ABS4, HOG4, PER4].sort());
  });

  it('Life boundary: Moria + 1 more Life card (1 left after the hit) plays them; Moria + 2 (2 left) does not', () => {
    const one = hit(1, [ABS4, HOG4, PER4]);
    need(one, 'trigger', 'p1');
    activateTrigger(one);
    expect(kind(one)).toBe('choose');
    playAll(one, [ABS4, HOG4, PER4]);
    expect(chars(one)).toHaveLength(3);

    const two = hit(2, [ABS4, HOG4, PER4]);
    need(two, 'trigger', 'p1');
    activateTrigger(two);
    expect(kind(two)).not.toBe('choose');
    expect(chars(two)).toEqual([]);
    expect(trash(two).sort()).toEqual([ID, ABS4, HOG4, PER4].sort());
  });

  it('with Moria as the last Life card (0 left) the effect works too', () => {
    const g = hit(0, [PER4]);
    activateTrigger(g);
    playAll(g, [PER4]);
    expect(chars(g)).toEqual([PER4]);
  });

  it('cost boundary: a cost-4 [Perona] is offered, a cost-5 [Perona] is not', () => {
    const g = hit(0, [PER4, PER5]);
    activateTrigger(g);
    expect(offeredIds(g)).toEqual([PER4]);
  });

  it('each name is "up to 1": with two [Absalom] in the trash only one is played', () => {
    const g = hit(0, [ABS4, ABS3]);
    activateTrigger(g);
    expect(offeredIds(g)).toEqual([ABS3, ABS4].sort());
    pickCards(g, [ABS3]);
    expect(kind(g)).not.toBe('choose');
    expect(chars(g)).toEqual([ABS3]);
    expect(trash(g).sort()).toEqual([ID, ABS4].sort());
  });

  it('"up to 1" each: I may play some and skip others', () => {
    const g = hit(0, [ABS4, HOG4, PER4]);
    activateTrigger(g);
    expect(mayChooseNone(g)).toBe(true);
    let skipped = false;
    for (let i = 0; i < 3 && kind(g) === 'choose'; i++) {
      const ids = offeredIds(g);
      if (!skipped && ids[0] === HOG4) {
        none(g);
        skipped = true;
      } else pickCards(g, [ids[0] as string]);
    }
    expect(skipped).toBe(true);
    expect(chars(g).sort()).toEqual([ABS4, PER4].sort());
  });

  it('only the named cards: other Characters in the trash are not played', () => {
    const g = hit(0, [SC16.wano3, SCN.c2, PER4]);
    activateTrigger(g);
    expect(offeredIds(g)).toEqual([PER4]);
  });

  it('declining the [Trigger]: Moria goes to my hand and nothing is played', () => {
    const g = hit(0, [PER4]);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(chars(g)).toEqual([]);
  });

  it('the Character limit applies: with 3 Characters already, playing 3 more asks me to trash down to 5', () => {
    const g = hit(0, [ABS4, HOG4, PER4], [SCN.c2, SCN.c3, SCN.c4]);
    activateTrigger(g);
    let limit = false;
    for (let i = 0; i < 8 && decision(g)?.kind === 'choose'; i++) {
      if (decision(g)?.purpose === 'characterLimit') {
        limit = true;
        g.act({ type: 'pick', choice: g.legal().find((a) => a.type === 'pick')!.choice as string });
      } else pickCards(g, [offeredIds(g)[0] as string]);
    }
    expect(limit).toBe(true);
    expect(chars(g)).toHaveLength(5);
  });
});
