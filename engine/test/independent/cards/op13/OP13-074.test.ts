/**
 * OP13-074 Hera (Character, Purple, cost 4, 5000, Counter +1000, {Big Mom Pirates}/{Homies}).
 *
 * Card text: "[On Play] Play up to 1 [Homies] type Character card with 3000 power or less from your hand."
 *
 * Rules: CR 4-8-1 ("up to"), a card played by an effect pays no cost (CR 6-5-3-?: "play" by effect),
 * the hidden-hand prompt rule (a prompt must not depend on hidden cards: an "up to" pick from a
 * non-empty hand is asked even with no match, max 0; an empty hand asks nothing).
 * Scenery: OP04-113 Rabiyan (Homies, 3000), OP08-107 Nitro (Homies, 2000), OP03-100 Kingbaum (Homies,
 * 5000), ST05-007 Gordon (3000, {FILM}: not a Homies).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  canFinish,
  chars,
  choices,
  don,
  hand,
  kind,
  LD13,
  me,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  S13,
  at,
  trash,
  act,
} from './kit-op13c.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import type { CardId } from '@optcg/engine';

const ID = 'OP13-074';

function play(handCards: CardId[], o: { trash?: CardId[] } = {}): TestGame {
  return me(LD13.plain, { hand: [ID, ...handCards], trash: o.trash ?? [] });
}

describe('OP13-074 Hera: [On Play] play up to 1 [Homies] Character card with 3000 power or less from hand', () => {
  it('offers a 3000-power Homies; playing it puts it on the field without paying its cost', () => {
    const g = play([S13.homies3]);
    const before = don(g);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.homies3]);
    pickInst(g, [at(g, 'p1', 'hand', S13.homies3)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([ID, S13.homies3].sort());
    expect(hand(g)).toEqual([]);
    // Only Hera's own cost 4 was paid.
    expect(don(g)).toMatchObject({ active: before.active - 4, rested: before.rested + 4 });
  });

  it('boundary: 3000 and 2000 power Homies are offered, a 5000 Homies and a 3000 non-Homies are not', () => {
    const g = play([S13.homies3, S13.homies2, S13.homies5, S13.gordon]);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.homies3, S13.homies2].sort());
  });

  it('"up to 1": may play nothing', () => {
    const g = play([S13.homies3]);
    playRaw(g, ID);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toEqual([S13.homies3]);
  });

  it('plays at most 1 even when two Homies qualify', () => {
    const g = play([S13.homies3, S13.homies2]);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'hand', S13.homies2)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([ID, S13.homies2].sort());
    expect(hand(g)).toEqual([S13.homies3]);
  });

  it('a non-empty hand with no match: the pick is still asked (max 0, nothing to pick) and ends with done', () => {
    const g = play([S13.homies5, S13.gordon]);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([]);
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([S13.homies5, S13.gordon].sort());
  });

  it('an empty hand: nothing can be played (the pick, if asked, is empty)', () => {
    const g = play([]);
    playRaw(g, ID);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([ID]);
  });

  it('only cards in hand: a Homies in the trash is not offered', () => {
    const g = play([S13.gordon], { trash: [S13.homies3] });
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    act(g, { type: 'done' });
    expect(trash(g)).toEqual([S13.homies3]);
  });

  it('the played Homies enters active (not rested)', () => {
    const g = play([S13.homies3]);
    playRaw(g, ID);
    pickInst(g, [at(g, 'p1', 'hand', S13.homies3)]);
    expect(g.card(at(g, 'p1', 'characters', S13.homies3)).rested).toBe(false);
  });
});
