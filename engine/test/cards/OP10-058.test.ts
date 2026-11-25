/** OP10-058 Rebecca. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { C8, deckOf, DR2, DR3, DR5, DR7, DR_EVENT, mk } from './helpers-a10g2.ts';

const ID = 'OP10-058';
/** [Issho] {Navy}{Dressrosa}, cost 8: a {Dressrosa} Character that is too expensive to play. */
const DR8 = 'OP12-082';

describe('OP10-058 Rebecca', () => {
  const start = (
    handCards: string[],
    p1: Parameters<typeof mk>[0] = {},
    p2chars: string[] = [C8],
  ) => mk({ hand: [ID, ...handCards], deck: deckOf([V.c1]), ...p1 }, { characters: p2chars });
  const mine = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters');
  const cardOf = (g: ReturnType<typeof mk>, c: string) => mine(g).find((x) => x.card === c);

  it('[On Play] with a Character of cost 8 or more: draws 1, reveals up to 2 {Dressrosa} Characters, plays 1 and plays the other rested when its cost is 4 or less', () => {
    const g = start([DR2, DR3]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', DR2), g.find('p1', 'hand', DR3)]);
    pick(g, [g.find('p1', 'hand', DR2)]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(cardOf(g, DR2)!.rested).toBe(false);
    expect(cardOf(g, DR3)!.rested).toBe(true);
    expectDecision(g, 'main', 'p1');
  });

  it('the other revealed card stays in the hand when its cost is 5 or more', () => {
    const g = start([DR2, DR5]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', DR2), g.find('p1', 'hand', DR5)]);
    pick(g, [g.find('p1', 'hand', DR2)]);
    expect(cardOf(g, DR2)).toBeDefined();
    expect(cardOf(g, DR5)).toBeUndefined();
    expect(hand(g, 'p1').sort()).toEqual([DR5, V.c1].sort());
  });

  it('the played card may be the expensive one; the cheap other one is then played rested', () => {
    const g = start([DR2, DR5]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', DR2), g.find('p1', 'hand', DR5)]);
    pick(g, [g.find('p1', 'hand', DR5)]);
    expect(cardOf(g, DR5)!.rested).toBe(false);
    expect(cardOf(g, DR2)!.rested).toBe(true);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('revealing 1 card plays it active; revealing none plays nothing', () => {
    const a = start([DR3]);
    play(a, ID);
    pick(a, [a.find('p1', 'hand', DR3)]);
    pick(a, [a.find('p1', 'hand', DR3)]); // "play 1 of the revealed cards": asked even with one
    expect(cardOf(a, DR3)!.rested).toBe(false);
    const b = start([DR3]);
    play(b, ID);
    none(b);
    expect(cardOf(b, DR3)).toBeUndefined();
    expect(hand(b, 'p1')).toEqual([DR3, V.c1]);
  });

  it('candidates: {Dressrosa} Characters with a cost of 7 or less; not an Event, not cost 8, not another type', () => {
    const g = start([DR7, DR8, DR_EVENT, V.c3]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'hand', DR7))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', DR8))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', DR_EVENT))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false);
  });

  it('only the revealed cards can be played: an unrevealed {Dressrosa} Character in hand is not a candidate', () => {
    const g = start([DR2, DR3]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', DR2)]);
    expect(canPick(g, g.find('p1', 'hand', DR2))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', DR3))).toBe(false);
    pick(g, [g.find('p1', 'hand', DR2)]);
    expect(cardOf(g, DR3)).toBeUndefined();
    expect(hand(g, 'p1').sort()).toEqual([DR3, V.c1].sort());
  });

  it('must not do anything (no draw, no reveal) without a Character of cost 8 or more', () => {
    const g = start([DR2, DR3], {}, [V.c7]);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toEqual([DR2, DR3]);
    expect(g.zone('p1', 'deck')).toHaveLength(11);
  });

  it('a Character of cost 8 or more on your own field counts too', () => {
    const g = start([DR3], { characters: [C8] }, []);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([DR3, V.c1]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', DR3)]);
    pick(g, [g.find('p1', 'hand', DR3)]);
    expect(cardOf(g, DR3)).toBeDefined();
  });

  it('with the field full only the first play fits the 5-Character limit', () => {
    const g = start([DR2, DR3], { characters: [V.c1, V.c2, V.c3] }, [C8]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', DR2), g.find('p1', 'hand', DR3)]);
    pick(g, [g.find('p1', 'hand', DR2)]);
    // 3 Characters + Rebecca + Dressrosa x2 = 6: one over the limit, so a choice to trash one is asked.
    expect(dec(g)?.kind).toBe('choose');
  });
});
