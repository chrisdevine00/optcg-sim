/**
 * OP10-058 Rebecca (Character, Blue, cost 7, 4000, Counter +1000, {Dressrosa}).
 *
 * Card text: "[On Play] If there is a Character with a cost of 8 or more, draw 1 card. Then, reveal up to 2
 * "Dressrosa" type Character cards with a cost of 7 or less other than [Rebecca] from your hand. Play
 * 1 of the revealed cards and play the other card rested if it has a cost of 4 or less."
 *
 * Rules: "there is a Character" counts either side, current cost, this card included (M4b-7); "Then" after
 * a failed "If" does not resolve (M4b-5); "up to 2" (CR 8-1-2); revealing is public (CR 11-2-1); a played
 * card is placed active unless the effect says rested; "other than [Rebecca]" excludes every card named
 * Rebecca; a prompt over the hand must not depend on which cards are there.
 * Scenery: OP12-082 Issho (cost 8, {Navy}/{Dressrosa}), OP10-050 Hajrudin (cost 7), OP10-054 Blue Gilly
 * (Dressrosa, cost 3), OP01-076 Bellamy (Dressrosa, cost 2), EB03-030 Viola (Dressrosa, cost 5),
 * OP13-090 Hack (Dressrosa, cost 6), OP12-082 Issho (Dressrosa, cost 8), OP01-023 Marco (not Dressrosa),
 * OP04-039 Rebecca (Leader card is not used; OP15-039 is a Leader), OP10-042 Usopp (Leader: {Dressrosa}
 * Characters with a cost of 2 or more gain +1 cost).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  C10,
  canFinish,
  decision,
  deck,
  doneRaw,
  expectMain,
  hand,
  hasEvent,
  inst,
  kind,
  L10,
  mine,
  need,
  offeredNow,
  pickCards,
  pickRaw,
  playRaw,
  zoneIds,
} from './kit-op10b.ts';

const REB = 'OP10-058';
const GILLY = C10.gilly; // Dressrosa, cost 3
const BELLA = C10.bellamyDr; // Dressrosa, cost 2
const VIOLA = C10.viola; // Dressrosa, cost 5
const HACK6 = C10.hack6; // Dressrosa, cost 6
const MARCO = C10.marco; // not Dressrosa
const ISSHO = C10.issho8; // Dressrosa, cost 8
const OTHER_REBECCA_HERO = REB;

function start(
  handCards: string[],
  o: { p1?: string[]; p2?: string[]; top?: string[]; leader?: string } = {},
): TestGame {
  return mine(
    o.leader ?? L10.dressrosa,
    {
      hand: [REB, ...handCards],
      characters: o.p1 ?? [],
      deck: [...(o.top ?? [C10.thatch]), C10.thatch, C10.thatch, C10.thatch],
    },
    { characters: o.p2 ?? [ISSHO] },
  );
}
const charOf = (g: TestGame, card: string) =>
  g.zone('p1', 'characters').find((c) => c.card === card);

describe('OP10-058 Rebecca: [On Play] with a Character of cost 8 or more: draw 1, then reveal up to 2 {Dressrosa} Characters (cost 7 or less) and play them', () => {
  it('draws 1 card, then offers the {Dressrosa} Characters of cost 7 or less in hand, the drawn card included (Marco and another Rebecca are not)', () => {
    const g = start([GILLY, VIOLA, MARCO, OTHER_REBECCA_HERO], { top: [BELLA] });
    playRaw(g, REB);
    need(g, 'choose', 'p1');
    expect(hand(g)).toContain(BELLA);
    expect(offeredNow(g)).toEqual([BELLA, GILLY, VIOLA].sort());
  });

  it('reveals 2: I play 1 active (my choice) and the other is played rested when its cost is 4 or less', () => {
    const g = start([GILLY, VIOLA], { top: [C10.thatch] });
    playRaw(g, REB);
    pickCards(g, [GILLY, VIOLA]);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([GILLY, VIOLA].sort());
    pickRaw(g, g.find('p1', 'hand', VIOLA));
    expectMain(g);
    // Viola (cost 5) played active; Gilly (cost 3) played rested
    expect(charOf(g, VIOLA)?.rested).toBe(false);
    expect(charOf(g, GILLY)?.rested).toBe(true);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([REB, GILLY, VIOLA].sort());
  });

  it('the chosen one is the active one: choosing the cost-3 card plays it active and the cost-5 one is not played at all', () => {
    const g = start([GILLY, VIOLA]);
    playRaw(g, REB);
    pickCards(g, [GILLY, VIOLA]);
    pickRaw(g, g.find('p1', 'hand', GILLY));
    expectMain(g);
    expect(charOf(g, GILLY)?.rested).toBe(false);
    expect(charOf(g, VIOLA)).toBeUndefined();
    expect(hand(g)).toContain(VIOLA);
  });

  it('boundary: the other card is played rested at cost 4 or less; with cost 5 or more it stays in hand (Viola and Hack, costs 5 and 6)', () => {
    const g = start([VIOLA, HACK6]);
    playRaw(g, REB);
    pickCards(g, [VIOLA, HACK6]);
    pickRaw(g, g.find('p1', 'hand', VIOLA));
    expectMain(g);
    expect(charOf(g, VIOLA)).toBeDefined();
    expect(charOf(g, HACK6)).toBeUndefined();
    expect(hand(g)).toContain(HACK6);
  });

  it('two cards of cost 4 or less: one active, one rested', () => {
    const g = start([GILLY, BELLA]);
    playRaw(g, REB);
    pickCards(g, [GILLY, BELLA]);
    pickRaw(g, g.find('p1', 'hand', BELLA));
    expectMain(g);
    expect(charOf(g, BELLA)?.rested).toBe(false);
    expect(charOf(g, GILLY)?.rested).toBe(true);
  });

  it('revealing a single card plays it active', () => {
    const g = start([GILLY]);
    playRaw(g, REB);
    pickCards(g, [GILLY]);
    // the engine still asks which revealed card to play (one candidate, min = max = 1)
    need(g, 'choose', 'p1');
    pickRaw(g, g.find('p1', 'hand', GILLY));
    expectMain(g);
    expect(charOf(g, GILLY)?.rested).toBe(false);
  });

  it('"up to 2": revealing nothing plays nothing, but the card was still drawn', () => {
    const g = start([GILLY], { top: [C10.sai] });
    playRaw(g, REB);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    doneRaw(g);
    // "play 1 of the revealed cards" with none revealed: a forced empty pick (max 0) or nothing
    if (kind(g) === 'choose') {
      expect(decision(g)?.max).toBe(0);
      doneRaw(g);
    }
    expectMain(g);
    expect(hand(g)).toEqual([C10.sai, GILLY].sort());
    expect(zoneIds(g, 'p1', 'characters')).toEqual([REB]);
  });

  it('a Dressrosa Character with a cost of 8 (Issho in hand) is not offered: cost 7 or less only', () => {
    const g = start([ISSHO, C10.hajrudin7], { p2: [ISSHO] });
    playRaw(g, REB);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.hajrudin7]);
  });

  it('the reveal prompt does not depend on the hand: with no qualifying card in hand it is still asked, with no candidates', () => {
    const g = start([MARCO], { top: [C10.sai] });
    playRaw(g, REB);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([]);
    expect(canFinish(g)).toBe(true);
  });

  // Was DISAGREEMENT (DISAGREEMENTS-b.md 1), fixed in the B3B-R3 fix round: "reveal up to 2 ..." now
  // announces each revealed card (a selector `reveal`), played or not.
  it('a card revealed from hand but not played (Viola, cost 5, the non-chosen one) is announced as revealed (CR 11-2-1)', () => {
    const g = start([GILLY, VIOLA]);
    playRaw(g, REB);
    pickCards(g, [GILLY, VIOLA]);
    pickRaw(g, g.find('p1', 'hand', GILLY));
    expect(hasEvent(g, 'CardRevealed', { card: VIOLA })).toBe(true);
  });

  it('a Character of cost 8 on my own side also satisfies the condition', () => {
    const g = start([GILLY], { p1: [ISSHO], p2: [] });
    playRaw(g, REB);
    need(g, 'choose', 'p1');
    expect(hand(g)).toHaveLength(2);
  });

  it('boundary: a Character with cost 7 (not 8) does not satisfy the condition: nothing is drawn, revealed or played', () => {
    const g = start([GILLY], { p2: [C10.hajrudin7] });
    const topBefore = deck(g)[0];
    playRaw(g, REB);
    expectMain(g);
    expect(hand(g)).toEqual([GILLY]);
    expect(deck(g)[0]).toBe(topBefore);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([REB]);
  });

  it('with no Character of cost 8 or more nothing is asked at all (the "Then" part does not resolve)', () => {
    const g = start([GILLY, VIOLA], { p2: [C10.mohji] });
    playRaw(g, REB);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([GILLY, VIOLA].sort());
    expect(zoneIds(g, 'p1', 'characters')).toEqual([REB]);
  });

  it('under [Usopp] ({Dressrosa} Characters of cost 2 or more gain +1 cost) Rebecca herself has cost 8, which satisfies the condition', () => {
    const g = start([GILLY], { p2: [C10.mohji], leader: L10.usopp });
    expect(g.card(g.find('p1', 'hand', REB)).cost).toBeGreaterThanOrEqual(7);
    playRaw(g, REB);
    need(g, 'choose', 'p1');
    expect(inst(g, 'p1', 'characters', REB)).toBeDefined();
    expect(hand(g)).toHaveLength(2);
  });
});
