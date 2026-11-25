/**
 * EB02-025 Donquixote Rosinante (Character, Blue, cost 2, 3000, Counter +1000, {Donquixote Pirates}/{Navy}).
 *
 * Card text: "[Activate: Main] You may rest 1 of your DON!! cards and this Character: If your Leader is
 * [Donquixote Rosinante], look at 5 cards from the top of your deck; play up to 1 Character card
 * with a cost of 2 or less rested. Then, place the rest at the bottom of your deck in any order."
 *
 * Reading: the "If" is after the colon, so it is an effect condition: the cost is paid and the
 * ability is used even when the Leader is another card, and then nothing happens (M4b-5 for "Then").
 * Rules: rest costs (CR 8-3), "up to" (CR 8-4-4-1), Character limit of 5 (CR 3-7-6).
 */
import { describe, expect, it } from 'vitest';
import {
  canActivate,
  canFinish,
  choices,
  decision,
  deck,
  donOf,
  driveLookPlay,
  E2C,
  E2L,
  fill,
  kind,
  mine,
  need,
  tail,
  activate,
  payDon,
  donChoices,
} from './kit-eb02a.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ROS = 'EB02-025';
/** OP12-061 Donquixote Rosinante: another Leader named [Donquixote Rosinante]. */
const ROS_LEADER_B = 'OP12-061';
/** ST01-014 Guard Point: Red Event, cost 1. */
const EVENT = 'ST01-014';

const FILL = E2C.mohji;

function pos(
  leader: string,
  top: string[],
  o: { chars?: string[]; active?: number; rested?: number } = {},
) {
  return mine(leader, {
    characters: [ROS, ...(o.chars ?? [])],
    deck: [...top, ...fill(FILL, 10)],
    costArea: { active: o.active ?? 3, rested: o.rested ?? 0 },
  });
}

function use(g: TestGame) {
  activate(g, g.find('p1', 'characters', ROS));
  if (kind(g) === 'choose' && donChoices(g).length > 0) payDon(g, 1, 'costActive');
}

describe('EB02-025 Rosinante: [Activate: Main] rest 1 DON!! and this: look at 5, play a Character with cost 2 or less rested', () => {
  it('pays the cost (1 DON!! rested, Rosinante rested) and plays the chosen Character rested', () => {
    const g = pos(E2L.rosinante, [E2C.marco, E2C.sai, E2C.mohji, E2C.mohji, E2C.mohji]);
    use(g);
    expect(g.card(g.find('p1', 'characters', ROS)).rested).toBe(true);
    expect([donOf(g, 'p1').active, donOf(g, 'p1').rested]).toEqual([2, 1]);
    driveLookPlay(g, [E2C.sai], []);
    const sai = g.find('p1', 'characters', E2C.sai);
    expect(g.card(sai).rested).toBe(true);
    need(g, 'main', 'p1');
  });

  it('the rest of the 5 cards go to the bottom of the deck; the 6th card is now on top', () => {
    const g = pos(E2L.rosinante, [E2C.marco, E2C.sai, E2C.hajrudin, E2C.kingdew, E2C.thatch]);
    use(g);
    driveLookPlay(g, [E2C.sai], []);
    // 15 cards - 1 played = 14; the four not played are the last four.
    expect(deck(g)).toHaveLength(14);
    expect(deck(g)[0]).toBe(FILL);
    expect(tail(deck(g), 4)).toEqual([E2C.hajrudin, E2C.kingdew, E2C.marco, E2C.thatch].sort());
  });

  it('only a Character card of cost 2 or less is offered (cost 3, an Event and the like are not)', () => {
    const g = pos(E2L.rosinante, [E2C.marco, EVENT, E2C.sai, E2C.komachiyo, E2C.hajrudin]);
    use(g);
    const names = choices(g)
      .map((i) => g.card(i).card)
      .sort();
    expect(names).toEqual([E2C.komachiyo, E2C.sai].sort());
  });

  it('"up to 1": may play nothing; all 5 looked-at cards go to the bottom', () => {
    const g = pos(E2L.rosinante, [E2C.sai, E2C.komachiyo, E2C.marco, E2C.hajrudin, E2C.kingdew]);
    use(g);
    expect(canFinish(g)).toBe(true);
    driveLookPlay(g, [], []);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ROS]);
    expect(deck(g)).toHaveLength(15);
    expect(deck(g)[0]).toBe(FILL);
    expect(tail(deck(g), 5)).toEqual(
      [E2C.sai, E2C.komachiyo, E2C.marco, E2C.hajrudin, E2C.kingdew].sort(),
    );
  });

  it('only the top 5 are looked at: a qualifying card in 6th place is not offered', () => {
    const g = pos(E2L.rosinante, [E2C.marco, E2C.marco, E2C.marco, E2C.marco, E2C.marco, E2C.sai]);
    use(g);
    expect(kind(g) === 'choose' ? choices(g) : []).toEqual([]);
    driveLookPlay(g, [], []);
    expect(deck(g)[0]).toBe(E2C.sai);
  });

  it('the Leader may be any card named [Donquixote Rosinante] (OP12-061 as well)', () => {
    const g = pos(ROS_LEADER_B, [E2C.sai, E2C.marco, E2C.marco, E2C.marco, E2C.marco]);
    use(g);
    expect(choices(g).map((i) => g.card(i).card)).toEqual([E2C.sai]);
  });

  it('with another Leader the cost is still paid, but no card is looked at or played', () => {
    const g = pos(E2L.croc, [E2C.sai, E2C.marco, E2C.marco, E2C.marco, E2C.marco]);
    use(g);
    expect(g.card(g.find('p1', 'characters', ROS)).rested).toBe(true);
    expect([donOf(g, 'p1').active, donOf(g, 'p1').rested]).toEqual([2, 1]);
    expect(decision(g)?.kind).toBe('main');
    expect(deck(g)).toHaveLength(15);
    expect(deck(g)[0]).toBe(E2C.sai);
  });

  it('the cost needs an active DON!!: with every DON!! rested the ability is not offered', () => {
    const g = pos(E2L.rosinante, [E2C.sai], { active: 0, rested: 3 });
    expect(canActivate(g, g.find('p1', 'characters', ROS))).toBe(false);
  });

  it('the cost needs Rosinante active: a rested Rosinante cannot activate it', () => {
    const g = mine(E2L.rosinante, {
      characters: [{ card: ROS, rested: true }],
      deck: [E2C.sai, ...fill(FILL, 14)],
      costArea: { active: 3, rested: 0 },
    });
    expect(canActivate(g, g.find('p1', 'characters', ROS))).toBe(false);
  });

  it('with 5 Characters on the field the played Character still enters (a Character must be trashed first)', () => {
    const g = pos(E2L.rosinante, [E2C.sai, E2C.marco, E2C.marco, E2C.marco, E2C.marco], {
      chars: [E2C.hajrudin, E2C.kingdew, E2C.thatch, E2C.komachiyo],
    });
    use(g);
    driveLookPlay(g, [E2C.sai], []);
    // The Character limit asks which of my Characters to trash (rule move, not a K.O.).
    const d = decision(g);
    expect(d?.kind).toBe('choose');
    expect(d?.purpose).toBe('characterLimit');
    g.act({ type: 'pick', choice: choices(g)[0]! });
    expect(g.zone('p1', 'characters')).toHaveLength(5);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(E2C.sai);
  });

  it('can be used the turn it is played (an [Activate: Main] is not an attack)', () => {
    const g = mine(E2L.rosinante, {
      characters: [{ card: ROS, playedThisTurn: true }],
      deck: [E2C.sai, ...fill(FILL, 14)],
      costArea: { active: 3, rested: 0 },
    });
    expect(canActivate(g, g.find('p1', 'characters', ROS))).toBe(true);
  });
});
