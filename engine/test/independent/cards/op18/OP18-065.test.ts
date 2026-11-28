/**
 * OP18-065 Saint Gunko (Character, Purple, cost 10, 11000, {Celestial Dragons}/{Holy Knights of God}).
 *
 * Card text (cards/data):
 *   "[Blocker]
 *    [On Play] DON!! −1: Play up to 1 {Celestial Dragons} type Character card with 6000 power or
 *    less from your trash."
 *
 * Rules: [Blocker] (CR 10-1-4). The [On Play] cost DON!! −1 may return any DON!! (the cost area has
 * 10 rested after paying 10 to play this card); the played card must be a {Celestial Dragons}
 * Character with printed power 6000 or less; the play is free; "up to 1" may take none; a card
 * played from the trash fires its own [On Play].
 *
 * Scenery: OP13-085 Saint Jalmac (Black, cost 2, 4000, {Celestial Dragons}, vanilla); OP18-064
 * Saint Killingham (cost 5, 6000, {Celestial Dragons}, its [On Play] is declined where it fires);
 * OP18-065 Saint Gunko (11000, a second copy in the trash: too strong); OP01-012 Sai (no type).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, attack, blockers, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  cardIds,
  choiceCards,
  choices,
  decline,
  donChoices,
  donOf,
  kind,
  LDR,
  LEAD,
  mine,
  need,
  offered,
  RED,
  side,
  theirTurn,
  VAN,
} from './kit-d.ts';

const GUNKO = 'OP18-065';
const JALMAC = 'OP13-085';
const KILL = 'OP18-064';

function game(trash: string[], p1: Partial<PlayerSpec> = {}): TestGame {
  return mine(LEAD.kaido, { hand: [GUNKO], trash, costArea: { active: 10, rested: 0 }, ...p1 });
}

/** Play Gunko and pay DON!! −1 from a rested DON!!. Stops at the pick from the trash. */
function start(g: TestGame) {
  play(g, g.find('p1', 'hand', GUNKO));
  need(g, 'optional', 'p1');
  accept(g);
  // Only rested DON!! exist: the single class may be paid without a question.
  if (donChoices(g).length) act(g, { type: 'pick', choice: { from: 'costRested' } });
}

describe('OP18-065 Saint Gunko: [Blocker]', () => {
  it('it can block an attack on its owner’s Leader', () => {
    const g = theirTurn(
      side(LDR.luffy, RED, { characters: [GUNKO] }),
      side(LDR.luffy, RED, { characters: [VAN.kingdew] }),
    );
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', GUNKO)]);
  });
});

describe('OP18-065 Saint Gunko: [On Play] DON!! −1: play up to 1 {Celestial Dragons} Character (6000 power or less) from the trash', () => {
  it('returns 1 DON!! and plays the chosen card from the trash for free', () => {
    const g = game([JALMAC, VAN.sai]);
    start(g);
    expect(choiceCards(g)).toEqual([JALMAC]);
    act(g, { type: 'pick', choice: g.find('p1', 'trash', JALMAC) });
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([GUNKO, JALMAC].sort());
    expect(cardIds(g, 'p1', 'trash')).toEqual([VAN.sai]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 9, deck: 1 });
    expect(kind(g)).toBe('main');
  });

  it('power boundary: a {Celestial Dragons} Character with exactly 6000 power is offered, the 11000 Gunko is not', () => {
    const g = game([KILL, GUNKO]);
    start(g);
    expect(choiceCards(g)).toEqual([KILL]);
  });

  it('a Character without the {Celestial Dragons} type (Sai) is not offered', () => {
    const g = game([VAN.sai]);
    start(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'characters')).toEqual([GUNKO]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([VAN.sai]);
  });

  it('"up to 1": taking none leaves the trash alone; the DON!! −1 stays paid', () => {
    const g = game([JALMAC]);
    start(g);
    act(g, { type: 'done' });
    expect(cardIds(g, 'p1', 'trash')).toEqual([JALMAC]);
    expect(donOf(g, 'p1')).toMatchObject({ deck: 1 });
  });

  it('declining the DON!! −1: nothing is played and no DON!! returns', () => {
    const g = game([JALMAC]);
    play(g, g.find('p1', 'hand', GUNKO));
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(cardIds(g, 'p1', 'trash')).toEqual([JALMAC]);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 10, deck: 0 });
  });

  it('the Character played from the trash fires its own [On Play] (Killingham asks about its DON!! −1)', () => {
    const g = game([KILL]);
    start(g);
    act(g, { type: 'pick', choice: g.find('p1', 'trash', KILL) });
    // Killingham's [Your Turn] [On Play] DON!! −1 is offered next.
    need(g, 'optional', 'p1');
    decline(g);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([GUNKO, KILL].sort());
  });
});
