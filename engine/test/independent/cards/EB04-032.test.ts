/**
 * EB04-032 Queen (Character, Purple, cost 1, 1000, Counter +1000, Animal Kingdom Pirates).
 *
 * Card text (cards/data, no override text patch):
 *   "[On Play] You may trash 1 {Animal Kingdom Pirates} type card from your hand: Draw 2 cards.
 *    [Activate: Main] [Once Per Turn] You may rest 2 of your DON!! cards: If your Leader has the
 *    {Animal Kingdom Pirates} type, add up to 1 DON!! card from your DON!! deck and rest it."
 *
 * Rules relied on:
 * - CR 2-4-3: {Type} is an exact type match; a card with several types matches if one is exact.
 * - CR 8-3-1-3 / 8-3-1-4: an unpayable or skipped optional cost means no effect.
 * - QA-GR "You may rest 1 of your DON!! cards" = ①: only active cost-area DON!! can be rested (CR 8-3-1-5).
 * - CR 8-3-3: the [Activate: Main] "if" is in the effect, so with a non-AKP Leader the cost may be
 *   paid but nothing is added.
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, fill } from '../helpers.ts';
import {
  AKP,
  accept,
  activate,
  canActivate,
  choiceCards,
  decline,
  donOf,
  kind,
  LEAD,
  myTurn,
  offered,
  payDon,
  payWith,
  PURPLE,
  RED,
  settleYes,
  side,
  sortedIds,
  VAN,
} from './kit.ts';

function playQueen(hand: string[], leader: string = LEAD.kaido) {
  const g = myTurn(
    side(leader, PURPLE, {
      hand: [AKP.queen1, ...hand],
      costArea: { active: 1, rested: 0 },
      deck: [VAN.marco, VAN.sai, ...fill(PURPLE, 10)],
    }),
    side(LEAD.luffy, RED),
  );
  act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.queen1) });
  return g;
}

function onField(p1: Partial<PlayerSpec>) {
  return myTurn(
    side(LEAD.kaido, PURPLE, { characters: [AKP.queen1], ...p1 }),
    side(LEAD.luffy, RED),
  );
}

describe('EB04-032 Queen: [On Play] trash 1 {Animal Kingdom Pirates} card: draw 2', () => {
  it('happy path: trash an AKP card (EB04-031 King) and draw 2', () => {
    const g = playQueen([AKP.king]);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [g.find('p1', 'hand', AKP.king)]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([AKP.king]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.marco, VAN.sai].sort());
  });

  it('CR 2-4-3: only exact {Animal Kingdom Pirates} cards pay; FILM and Land of Wano do not → nothing offered', () => {
    const g = playQueen([VAN.gordon, AKP.yamato]);
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.gordon, AKP.yamato].sort());
  });

  it('CR 2-4-2: a card with several types (OP17-061 Fish-Man / AKP) pays; Gordon is not offered', () => {
    const g = playQueen([AKP.leadPerformers, VAN.gordon]);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    if (kind(g) === 'choose') expect(choiceCards(g)).toEqual([AKP.leadPerformers]);
    payWith(g, [g.find('p1', 'hand', AKP.leadPerformers)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.gordon, VAN.marco, VAN.sai].sort());
  });

  it('CR 8-3-1-4: declining draws nothing', () => {
    const g = playQueen([AKP.king]);
    decline(g);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([AKP.king]);
  });

  it('the [On Play] has no Leader condition: it works under a non-AKP Leader', () => {
    const g = playQueen([AKP.king], LEAD.shanks);
    accept(g);
    payWith(g, [g.find('p1', 'hand', AKP.king)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.marco, VAN.sai].sort());
  });
});

describe('EB04-032 Queen: [Activate: Main] [Once Per Turn] rest 2 DON!!: add 1 rested DON!!', () => {
  it('happy path: rests 2 active DON!! and adds 1 rested from the DON!! deck', () => {
    const g = onField({ costArea: { active: 2, rested: 0 } });
    const queen = g.find('p1', 'characters', AKP.queen1);
    activate(g, queen);
    payDon(g, 2);
    settleYes(g, 'p1');
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 3, deck: 7 });
  });

  it('CR 10-2-13: [Once Per Turn]', () => {
    const g = onField({ costArea: { active: 4, rested: 0 } });
    const queen = g.find('p1', 'characters', AKP.queen1);
    activate(g, queen);
    payDon(g, 2);
    settleYes(g, 'p1');
    expect(canActivate(g, queen)).toBe(false);
  });

  it('CR 8-3-1-3 / 8-3-1-5: with 1 active DON!! (rested ones cannot be rested) it is not offered', () => {
    const g = onField({ costArea: { active: 1, rested: 5 } });
    expect(canActivate(g, g.find('p1', 'characters', AKP.queen1))).toBe(false);
  });

  it('CR 8-3-3: non-AKP Leader → no DON!! added', () => {
    const g = onField({ leader: LEAD.shanks, costArea: { active: 2, rested: 0 } });
    const queen = g.find('p1', 'characters', AKP.queen1);
    if (canActivate(g, queen)) {
      activate(g, queen);
      payDon(g, 2);
      settleYes(g, 'p1');
    }
    expect(donOf(g, 'p1').deck).toBe(8);
  });

  it('CR 3-7-4 only limits attacks: a Queen played this turn may activate', () => {
    const g = onField({
      characters: [{ card: AKP.queen1, playedThisTurn: true }],
      costArea: { active: 2, rested: 0 },
    });
    expect(canActivate(g, g.find('p1', 'characters', AKP.queen1))).toBe(true);
  });
});
