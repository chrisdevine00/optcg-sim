/**
 * OP17-091 Brook (Character, Black, cost 2, 2000, Counter +1000; Elbaph / Straw Hat Crew).
 *
 * Card text:
 *   "If there is a Character with a cost of 12 or more, this Character gains +3000 power.
 *    [On Play] If there is a Character with a cost of 12 or more, your opponent trashes 1 card from
 *    their hand."
 *
 * Rules: either player's field counts; "your opponent trashes 1 card" is the opponent's pick
 * (CR 8-2-1 style: the player who trashes chooses); CR 4-10-1 a false "if" resolves nothing; an
 * empty hand trashes nothing (CR 1-3-2). Cost-12 scenery: OP17-089 Jaguar.D.Saul (16 on the field).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  BLUE,
  choiceCards,
  choose,
  decider,
  finish,
  kind,
  LD,
  LEAD,
  myTurn,
  playFromHand,
  RED,
  side,
  sortedIds,
  VAN,
} from './kit-d.ts';

const BROOK = 'OP17-091';
const SAUL = 'OP17-089';

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LD.navy, BLUE, { hand: [BROOK], costArea: { active: 2, rested: 0 }, ...p1 }),
    side(LEAD.luffy, RED, p2),
  );
}

describe('OP17-091 Brook: +3000 power if there is a Character with cost 12 or more', () => {
  it('without one: 2000; with your own: 5000; with the opponent’s: 5000', () => {
    expect(
      game({ characters: [BROOK] }).power(
        game({ characters: [BROOK] }).find('p1', 'characters', BROOK),
      ),
    ).toBe(2000);
    const own = game({ characters: [BROOK, SAUL] });
    expect(own.power(own.find('p1', 'characters', BROOK))).toBe(5000);
    const theirs = game({ characters: [BROOK] }, { characters: [SAUL] });
    expect(theirs.power(theirs.find('p1', 'characters', BROOK))).toBe(5000);
  });
});

describe('OP17-091 Brook: [On Play] your opponent trashes 1 card from their hand', () => {
  it('condition met: the OPPONENT chooses which card to trash', () => {
    const g = game({ characters: [SAUL] }, { hand: [VAN.sai, VAN.marco] });
    playFromHand(g, BROOK);
    expect(decider(g)).toBe('p2');
    expect(choiceCards(g)).toEqual([VAN.marco, VAN.sai].sort());
    choose(g, [g.find('p2', 'hand', VAN.marco)]);
    expect(sortedIds(g, 'p2', 'hand')).toEqual([VAN.sai]);
    expect(sortedIds(g, 'p2', 'trash')).toEqual([VAN.marco]);
    expect(kind(g)).toBe('main');
  });

  it('the opponent’s own cost-12+ Character satisfies the condition', () => {
    const g = game({}, { characters: [SAUL], hand: [VAN.sai, VAN.marco] });
    playFromHand(g, BROOK);
    choose(g, [g.find('p2', 'hand', VAN.sai)]);
    expect(sortedIds(g, 'p2', 'hand')).toEqual([VAN.marco]);
  });

  it('exactly 1 card is trashed (never 2), and your own hand is untouched', () => {
    const g = game(
      { characters: [SAUL], hand: [BROOK, VAN.komachiyo] },
      { hand: [VAN.sai, VAN.marco, VAN.komachiyo] },
    );
    playFromHand(g, BROOK);
    choose(g, [g.find('p2', 'hand', VAN.sai)]);
    expect(g.zone('p2', 'hand')).toHaveLength(2);
    expect(g.zone('p2', 'trash')).toHaveLength(1);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.komachiyo]);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
  });

  it('CR 4-10-1: with no cost-12 Character nothing is trashed and nothing is asked', () => {
    const g = game({}, { hand: [VAN.sai, VAN.marco] });
    playFromHand(g, BROOK);
    expect(kind(g)).toBe('main');
    expect(g.zone('p2', 'hand')).toHaveLength(2);
  });

  it('CR 1-3-2: an empty opposing hand trashes nothing', () => {
    const g = game({ characters: [SAUL] }, { hand: [] });
    playFromHand(g, BROOK);
    // effect-dsl 4.11: "exactly n" with 0 candidates has no decision. The engine may still show a
    // vacuous 0-pick choose (DISAGREEMENTS-d.md, note 1); either way nothing can be trashed.
    if (kind(g) === 'choose') finish(g);
    expect(kind(g)).toBe('main');
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });

  it('a one-card opposing hand is trashed (the pick is forced either way)', () => {
    const g = game({ characters: [SAUL] }, { hand: [VAN.sai] });
    playFromHand(g, BROOK);
    if (kind(g) === 'choose') choose(g, [g.find('p2', 'hand', VAN.sai)]);
    expect(g.zone('p2', 'hand')).toHaveLength(0);
    expect(sortedIds(g, 'p2', 'trash')).toEqual([VAN.sai]);
  });
});
