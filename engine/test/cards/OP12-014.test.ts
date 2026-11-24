/** OP12-014 Boa Hancock. */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import {
  dec,
  don,
  expectDecision,
  game,
  hand,
  none,
  option,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { cardsOf, finishOrder, LUFFY_C, SHC_LEADER } from './helpers-luffyace.ts';
import { activateAb, at, canActivate, choices, EVENTS } from './helpers-op12g1.ts';

const ID = 'OP12-014';
/** A purple Event: not red, so not offered. */
const PURPLE_EVENT = 'OP15-074';
const deck = [PURPLE, LUFFY_C, EVENTS[0], PURPLE_EVENT, V.c3, V.c4, V.c5];

describe('OP12-014 Boa Hancock', () => {
  const start = (p1: Record<string, unknown> = {}) =>
    game(
      { leader: SHC_LEADER, hand: [ID], deck, costArea: { active: 3, rested: 3 }, ...p1 },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: look at 5, take up to 1 [Monkey.D.Luffy] or red Event; the rest go to the bottom in any order', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    const v = project(g.state, 'p1') as unknown as { looking: { card: string }[] };
    expect(v.looking).toHaveLength(5);
    // [Luffy] and the red Event; not the purple Event, not the 6th card.
    expect(choices(g).sort()).toEqual(
      [g.find('p1', 'deck', LUFFY_C), g.find('p1', 'deck', EVENTS[0])].sort(),
    );
    pick(g, [g.find('p1', 'deck', LUFFY_C)]);
    expect(hand(g, 'p1')).toEqual([LUFFY_C]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(LUFFY_C);
    finishOrder(g);
    expectDecision(g, 'main', 'p1');
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(deck[5]);
  });

  it('[On Play]: may take nothing', () => {
    const g = start();
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(deck.length);
  });

  it('[Activate: Main]: trash this Character: give up to 2 rested DON!! to your Leader or 1 Character', () => {
    const g = start({ hand: [], characters: [ID, V.c3] });
    activateAb(g, at(g, 'p1', 'characters', ID), 'activate');
    option(g, '2');
    // Hancock is already trashed: the Leader and the other Character are the targets.
    expect(choices(g).sort()).toEqual([g.leader('p1'), at(g, 'p1', 'characters', V.c3)].sort());
    pick(g, [at(g, 'p1', 'characters', V.c3)]);
    expect(g.card(at(g, 'p1', 'characters', V.c3)).don).toBe(2);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
    expect(don(g, 'p1')).toMatchObject({ rested: 1, given: 2 });
  });

  it('[Activate: Main]: a count of 1, and no rested DON!! still trashes this Character', () => {
    const g = start({ hand: [], characters: [ID] });
    activateAb(g, at(g, 'p1', 'characters', ID), 'activate');
    option(g, '1');
    // The Leader is the only target left (Hancock is trashed): given without a choice.
    expect(g.card(g.leader('p1')).don).toBe(1);
    const h = start({ hand: [], characters: [ID], costArea: { active: 3, rested: 0 } });
    activateAb(h, at(h, 'p1', 'characters', ID), 'activate');
    expect(dec(h)?.kind).toBe('main');
    expect(h.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it('[Activate: Main] is available the turn it is played', () => {
    const g = start();
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(canActivate(g, at(g, 'p1', 'characters', ID), 'activate')).toBe(true);
  });
});
