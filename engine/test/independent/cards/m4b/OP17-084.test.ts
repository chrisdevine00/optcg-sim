/**
 * OP17-084 Tony Tony.Chopper (Character, Black, cost 1, 2000, Counter +2000, {Animal}/{Straw Hat
 * Crew}/{Elbaph}).
 *
 * Card text:
 *   "[On Play] If there is a Character with a cost of 12 or more, up to 1 of your Characters
 *    gains [Unblockable] during this turn. (This card cannot be blocked.)"
 *
 * Rules: CR 4-10-1 (failed "if" → nothing); CR 10-1-7-1 ([Unblockable]); CR 8-4-4-1 ("up to");
 * the condition counts either player's Characters (current cost, RL-43); "your Characters"
 * includes Chopper himself; CR 6-6-1-3 ("during this turn").
 */
import { describe, expect, it } from 'vitest';
import { attack, endTurn } from '../../helpers.ts';
import { kind, myTurn } from '../kit.ts';
import {
  blockOptions,
  C,
  drive,
  FILLER,
  offeredCards,
  playCard,
  side,
  sorted,
  V,
} from './kit-c.ts';

const ID = 'OP17-084';

function game(mineExtra: string[], theirs: string[]) {
  return myTurn(
    side(C.luffy, FILLER, {
      hand: [ID],
      characters: [V.marco, ...mineExtra],
      costArea: { active: 1, rested: 0 },
    }),
    side(C.shanks, FILLER, { characters: [C.blocker, ...theirs] }),
  );
}

describe('OP17-084 Chopper: [On Play] with a cost 12+ Character, up to 1 of your Characters gains [Unblockable]', () => {
  it("own Saul on the field: Marco becomes unblockable (the opponent's Blocker is not offered)", () => {
    const g = game([C.saul], []);
    const marco = g.find('p1', 'characters', V.marco);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [marco] });
    expect(g.card(marco).keywords).toContain('Unblockable');
    attack(g, marco, g.leader('p2'));
    expect(blockOptions(g)).toEqual([]);
  });

  it("the opponent's cost 12+ Character also enables it", () => {
    const g = game([], [C.saul]);
    const marco = g.find('p1', 'characters', V.marco);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [marco] });
    attack(g, marco, g.leader('p2'));
    expect(blockOptions(g)).toEqual([]);
  });

  it('control: a Character that did not get it can be blocked', () => {
    const g = game([C.saul], []);
    const marco = g.find('p1', 'characters', V.marco);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [] });
    attack(g, marco, g.leader('p2'));
    expect(blockOptions(g)).toEqual([g.find('p2', 'characters', C.blocker)]);
  });

  it('candidates are only my own Characters, Chopper himself included', () => {
    const g = game([C.saul], []);
    playCard(g, 'p1', ID);
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual(sorted([V.marco, C.saul, ID]));
  });

  it('Chopper can give it to himself', () => {
    const g = game([C.saul], []);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'characters', ID)] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Unblockable');
  });

  it('"up to 1": only one Character gets it', () => {
    const g = game([C.saul], []);
    const marco = g.find('p1', 'characters', V.marco);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [marco, g.find('p1', 'characters', C.saul)] });
    const have = g
      .zone('p1', 'characters')
      .filter((c) => g.card(c.instance).keywords.includes('Unblockable'));
    expect(have).toHaveLength(1);
  });

  it('CR 4-10-1: with no cost 12+ Character nothing happens and nothing is offered', () => {
    const g = game([C.cost10], []);
    const marco = g.find('p1', 'characters', V.marco);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [marco] });
    expect(g.card(marco).keywords).not.toContain('Unblockable');
    attack(g, marco, g.leader('p2'));
    expect(blockOptions(g)).toHaveLength(1);
  });

  it('"during this turn": Unblockable is gone on the next turn', () => {
    const g = game([C.saul], []);
    const marco = g.find('p1', 'characters', V.marco);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [marco] });
    endTurn(g);
    expect(g.card(marco).keywords).not.toContain('Unblockable');
  });
});
