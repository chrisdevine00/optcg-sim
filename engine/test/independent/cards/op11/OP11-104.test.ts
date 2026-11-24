/**
 * OP11-104 Shirley (Character, Yellow, cost 3, 4000, Counter +1000, {Merfolk}/{Fish-Man Island}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] You may turn 1 card from the top of your Life cards face-down: Look at
 * 3 cards from the top of your deck; reveal up to 1 "Fish-Man Island" type card and add it to your
 * hand. Then, place the rest at the top or bottom of the deck in any order."
 *
 * There is no Leader condition on this card. Rules: CR 8-3-1-4 (cost), CR 1-3-2-1 (needs a face-up
 * top Life card), CR 8-4-4 ("up to"), CR 2-4-3 (type match: {Fish-Man} alone is not {Fish-Man Island}).
 * Scenery: OP11-113 Ryuboshi / OP11-111 Mamboshi / OP11-032 Surume (all {Fish-Man Island}).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  cnt,
  hand,
  kind,
  LD11,
  lifeFaces,
  lifeUp,
  me,
  need,
  no,
  none,
  offeredIds,
  optionIds,
  orderFirst,
  outcomes,
  pickInst,
  pickOption,
  playRaw,
  SC11,
  trash,
  unusable,
  up,
  yes,
  type LifeRow,
} from './kit-op11c.ts';

const ID = 'OP11-104';
const FMI_A = SC11.fmi5;
const FMI_B = SC11.fmi6;

function start(o: { leader?: string; deck?: string[]; life?: LifeRow } = {}) {
  const g = me(
    o.leader ?? LD11.shirahoshi,
    {
      hand: [ID],
      life: o.life ?? lifeUp(4),
      deck: o.deck ?? [FMI_A, SC11.r2, FMI_B, SC11.r4, SC11.r5, SC11.r6],
    },
    {},
  );
  playRaw(g, ID);
  return g;
}

const top = (g: ReturnType<typeof start>, n: number) =>
  g
    .zone('p1', 'deck')
    .slice(0, n)
    .map((c) => c.card);

describe('OP11-104 Shirley: turn a Life card face-down, look at 3, add a {Fish-Man Island} card, place the rest top or bottom', () => {
  it('has [Blocker]', () => {
    const g = me(LD11.shirahoshi, { characters: [ID] });
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('printed effect: the chosen {Fish-Man Island} card goes to my hand, the rest go to the bottom', () => {
    const g = start();
    yes(g, 'p1');
    expect(lifeFaces(g)).toEqual([false, true, true, true]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'deck', FMI_A)]);
    pickOption(g, 'bottom');
    while (kind(g) === 'order') orderFirst(g, 'p1');
    expect(hand(g)).toEqual([FMI_A]);
    expect(top(g, 3)).toEqual([SC11.r4, SC11.r5, SC11.r6]);
    expect(
      g
        .zone('p1', 'deck')
        .slice(-2)
        .map((c) => c.card)
        .sort(),
    ).toEqual([SC11.r2, FMI_B].sort());
    expect(kind(g)).toBe('main');
  });

  it('the rest may go back on top instead', () => {
    const g = start();
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'deck', FMI_A)]);
    pickOption(g, 'top');
    while (kind(g) === 'order') orderFirst(g, 'p1');
    expect(top(g, 2).sort()).toEqual([SC11.r2, FMI_B].sort());
    expect(top(g, 4)[2]).toBe(SC11.r4);
  });

  it('"in any order": both orders of the 2 cards are reachable on top', () => {
    const g = start();
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'deck', FMI_A)]);
    const seen = outcomes(g, 'p1', (x) =>
      x
        .zone('p1', 'deck')
        .slice(0, 2)
        .map((c) => c.card)
        .join('+'),
    );
    expect(seen.has([SC11.r2, FMI_B].join('+'))).toBe(true);
    expect(seen.has([FMI_B, SC11.r2].join('+'))).toBe(true);
  });

  it('only {Fish-Man Island} cards are offered, not other cards of the top 3', () => {
    const g = start();
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([FMI_A, FMI_B].sort());
  });

  it('{Fish-Man} alone is not {Fish-Man Island}: a Jinbe among the top 3 is not offered', () => {
    const g = start({ deck: [SC11.fishMan2, FMI_A, SC11.r3, SC11.r4, SC11.r5] });
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([FMI_A]);
  });

  it('only the top 3 are looked at: a {Fish-Man Island} card in 4th place is not offered', () => {
    const g = start({ deck: [FMI_A, SC11.r2, SC11.r3, FMI_B, SC11.r5] });
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([FMI_A]);
  });

  it('"up to 1": adding none puts all 3 cards back at the top or bottom', () => {
    const g = start();
    yes(g, 'p1');
    none(g);
    expect(optionIds(g)).toEqual(['top', 'bottom']);
    pickOption(g, 'bottom');
    while (kind(g) === 'order') orderFirst(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(cnt(g, 'p1', 'deck')).toBe(6);
    expect(top(g, 3)).toEqual([SC11.r4, SC11.r5, SC11.r6]);
  });

  it('"you may": declining turns nothing face-down and looks at nothing', () => {
    const g = start();
    no(g, 'p1');
    expect(lifeFaces(g)).toEqual([true, true, true, true]);
    expect(top(g, 1)).toEqual([FMI_A]);
    expect(kind(g)).toBe('main');
  });

  it('no Leader condition: a non-[Shirahoshi] Leader can use it too', () => {
    const g = start({ leader: LD11.plain });
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'deck', FMI_A)]);
    expect(hand(g)).toEqual([FMI_A]);
  });

  it('unpayable: the top Life card is already face-down', () => {
    const g = start({ life: [SC11.r1, up(SC11.r2)] });
    unusable(g, 'p1');
    expect(top(g, 1)).toEqual([FMI_A]);
    expect(trash(g)).toEqual([]);
  });

  it('unpayable: no Life cards', () => {
    const g = start({ life: [] });
    unusable(g, 'p1');
    expect(kind(g)).toBe('main');
  });
});
