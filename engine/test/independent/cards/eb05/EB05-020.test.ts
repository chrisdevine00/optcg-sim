/**
 * EB05-020 My name is Shirahoshi!! (Event, Green, cost 1, {Merfolk}/{Fish-Man Island}).
 *
 * Card text: "[Main] You may rest your Leader [Shirahoshi]: Draw 2 cards."
 *
 * Rules: CR 8-3-1-3/-4 (costs), CR 4-5-3 (draw X), CR 2-7-3 (Event play), CR 4-4 (only an active card
 * can be rested).
 */
import { describe, expect, it } from 'vitest';
import { endTurn, fill } from '../../helpers.ts';
import {
  accept,
  BLUE,
  deck,
  decline,
  EL,
  hand,
  kind,
  mine,
  offered,
  play,
  skipUnusable,
  trash,
} from './kit-eb05a.ts';

const EVENT = 'EB05-020';

function start(leader: string | { card: string; rested: boolean }, active = 3) {
  const g = mine(leader, {
    hand: [EVENT],
    costArea: { active, rested: 0 },
    deck: fill(BLUE, 10),
  });
  play(g, g.find('p1', 'hand', EVENT));
  return g;
}

describe('EB05-020 My name is Shirahoshi!!: [Main] rest your Leader [Shirahoshi]: draw 2', () => {
  it('resting the active Shirahoshi Leader draws 2 cards; the Event goes to the trash', () => {
    const g = start(EL.shirahoshi);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(hand(g)).toEqual([BLUE, BLUE]);
    expect(deck(g)).toHaveLength(8);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('draws exactly 2', () => {
    const g = start(EL.shirahoshi);
    accept(g);
    expect(hand(g)).toHaveLength(2);
  });

  it('CR 8-3-1-4: declining the cost draws nothing and leaves the Leader active (the Event is still spent)', () => {
    const g = start(EL.shirahoshi);
    decline(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([EVENT]);
    expect(kind(g)).toBe('main');
  });

  it('CR 8-3-1-3: a Leader that is not [Shirahoshi] cannot pay the cost', () => {
    const g = start(EL.croc);
    skipUnusable(g, 'p1');
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(hand(g)).toEqual([]);
  });

  it('CR 8-3-1-3: an already rested Shirahoshi Leader cannot be rested again: nothing is drawn', () => {
    const g = start({ card: EL.shirahoshi, rested: true });
    skipUnusable(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(10);
  });

  it('the Leader stays rested for the rest of the turn and refreshes next turn', () => {
    const g = start(EL.shirahoshi);
    accept(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    endTurn(g);
    endTurn(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('only the Leader is rested, never a Character or DON!! beyond the Event’s own cost', () => {
    const g = start(EL.shirahoshi, 3);
    accept(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});
