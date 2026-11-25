/**
 * EB02-002 Sabo (Character, Red, cost 4, 5000, Counter +2000, {Revolutionary Army}/{Dressrosa}).
 *
 * Card text: "[Activate: Main] You may rest this Character: Up to 1 of your "Revolutionary Army" type
 * Characters other than [Sabo] gains +2000 power during this turn."
 *
 * Rules: CR 8-3 (costs), "up to" (CR 8-4-4-1), "other than [Sabo]" is a name exclusion.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  activate,
  canActivate,
  choices,
  choose,
  chooseNone,
  canFinish,
  E2C,
  E2L,
  kind,
  mine,
  need,
  toMyNextMain,
} from './kit-eb02a.ts';

const SABO = 'EB02-002';

function pos(chars: PlayerSpec['characters']) {
  return mine(E2L.shc, { characters: chars });
}

describe('EB02-002 Sabo: [Activate: Main] rest this: another {Revolutionary Army} Character +2000', () => {
  it('rests Sabo and gives the chosen {Revolutionary Army} Character +2000 this turn', () => {
    const g = pos([SABO, E2C.koala]);
    const koala = g.find('p1', 'characters', E2C.koala);
    expect(g.power(koala)).toBe(4000);
    activate(g, g.find('p1', 'characters', SABO));
    choose(g, [koala]);
    expect(g.power(koala)).toBe(6000);
    expect(g.card(g.find('p1', 'characters', SABO)).rested).toBe(true);
    need(g, 'main', 'p1');
  });

  it('the boost lasts this turn only', () => {
    const g = pos([SABO, E2C.koala]);
    const koala = g.find('p1', 'characters', E2C.koala);
    activate(g, g.find('p1', 'characters', SABO));
    choose(g, [koala]);
    toMyNextMain(g);
    expect(g.power(koala)).toBe(4000);
  });

  it('only {Revolutionary Army} Characters are offered (a Character of another type is not)', () => {
    const g = pos([SABO, E2C.koala, E2C.mohji]);
    activate(g, g.find('p1', 'characters', SABO));
    expect(kind(g)).toBe('choose');
    const offered = choices(g);
    expect(offered).toContain(g.find('p1', 'characters', E2C.koala));
    expect(offered).not.toContain(g.find('p1', 'characters', E2C.mohji));
  });

  it('"other than [Sabo]": Sabo himself is not a target', () => {
    const g = pos([SABO, E2C.koala]);
    const sabo = g.find('p1', 'characters', SABO);
    activate(g, sabo);
    expect(choices(g)).not.toContain(sabo);
  });

  it('"other than [Sabo]" is by name: a second Sabo is not a target either', () => {
    const g = pos([SABO, SABO, E2C.koala]);
    activate(g, g.find('p1', 'characters', SABO, 0));
    const offered = choices(g);
    expect(offered).not.toContain(g.find('p1', 'characters', SABO, 0));
    expect(offered).not.toContain(g.find('p1', 'characters', SABO, 1));
    expect(offered).toContain(g.find('p1', 'characters', E2C.koala));
  });

  it('"up to 1": choosing nothing still costs the rest and gives no boost', () => {
    const g = pos([SABO, E2C.koala]);
    const koala = g.find('p1', 'characters', E2C.koala);
    activate(g, g.find('p1', 'characters', SABO));
    expect(canFinish(g)).toBe(true);
    chooseNone(g);
    expect(g.power(koala)).toBe(4000);
    expect(g.card(g.find('p1', 'characters', SABO)).rested).toBe(true);
  });

  it('gives the boost to exactly one Character even when several qualify', () => {
    const g = pos([SABO, E2C.koala, E2C.hack, E2C.morley]);
    const koala = g.find('p1', 'characters', E2C.koala);
    const hack = g.find('p1', 'characters', E2C.hack);
    const morley = g.find('p1', 'characters', E2C.morley);
    activate(g, g.find('p1', 'characters', SABO));
    choose(g, [hack]);
    expect(g.power(hack)).toBe(7000);
    expect(g.power(koala)).toBe(4000);
    expect(g.power(morley)).toBe(6000);
  });

  it('the rest cost cannot be paid by a rested Sabo: the ability is not offered', () => {
    const g = pos([{ card: SABO, rested: true }, E2C.koala]);
    expect(canActivate(g, g.find('p1', 'characters', SABO))).toBe(false);
  });

  it('can be used on the turn Sabo is played (an [Activate: Main] is not an attack)', () => {
    const g = pos([{ card: SABO, playedThisTurn: true }, E2C.koala]);
    expect(canActivate(g, g.find('p1', 'characters', SABO))).toBe(true);
  });

  it('with no other {Revolutionary Army} Character the cost may still be paid and nothing is boosted', () => {
    const g = pos([SABO, E2C.mohji]);
    activate(g, g.find('p1', 'characters', SABO));
    // Either no prompt, or an empty "up to" pick that can only be finished.
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      chooseNone(g);
    }
    need(g, 'main', 'p1');
    expect(g.power(g.find('p1', 'characters', E2C.mohji))).toBe(3000);
  });

  it('is not used by itself: no card is rested or boosted until the ability is activated', () => {
    const g = pos([SABO, E2C.koala]);
    expect(g.card(g.find('p1', 'characters', SABO)).rested).toBe(false);
    expect(g.power(g.find('p1', 'characters', E2C.koala))).toBe(4000);
  });
});
