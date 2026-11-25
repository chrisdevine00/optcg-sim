/** OP09-101 Kuzan. */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import { expectValid } from './m6b-w1/probe.ts';
import {
  accept,
  dec,
  expectDecision,
  game,
  option,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from './helpers.ts';
import { atMain, ids, optionIds, pickableCardIds } from './helpers-w7c1.ts';

const ID = 'OP09-101';

describe('OP09-101 Kuzan', () => {
  const mk = (p1: object = {}, p2: object = {}) =>
    game(
      { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 4, rested: 0 }, ...p1 },
      {
        leader: PLAIN_BLUE,
        characters: [V.c3, V.c4],
        hand: [V.c1, V.c2],
        life: [V.c6, V.c4, V.c5],
        ...p2,
      },
    );
  /** Play Kuzan and, when the placement (the cost, W57-R1) can be paid, agree to pay it. */
  const play = (g: ReturnType<typeof mk>) => {
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    if (dec(g)?.kind === 'optional') accept(g);
  };
  const playOnly = (g: ReturnType<typeof mk>) =>
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });

  it('[On Play]: place an opponent Character (cost 3 or less) at the top of their Life face-up, then they trash 1 card of their choice', () => {
    const g = mk();
    play(g);
    // The only eligible Character is chosen for the cost: nothing to pick.
    expect(optionIds(g)).toEqual(['top', 'bottom']);
    option(g, 'top');
    const life = g.zone('p2', 'life');
    expect(life.map((c) => c.card)).toEqual([V.c3, V.c6, V.c4, V.c5]);
    expect(life[0]!.faceUp).toBe(true);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c4]);
    // The opponent chooses what to trash from their own hand.
    const d = dec(g)!;
    expect(d.kind).toBe('choose');
    expect(d.player).toBe('p2');
    pick(g, [g.find('p2', 'hand', V.c2)]);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c2]);
    expect(ids(g, 'p2', 'hand')).toEqual([V.c1]);
    expect(atMain(g)).toBe(true);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('the bottom of their Life is allowed too', () => {
    const g = mk();
    play(g);
    // The only eligible Character is chosen for the cost: nothing to pick.
    option(g, 'bottom');
    expect(ids(g, 'p2', 'life')).toEqual([V.c6, V.c4, V.c5, V.c3]);
  });

  it('boundary: a cost of 3 can be placed, a cost of 4 cannot (and 4 alone leaves the ability unpayable)', () => {
    const g = mk({}, { characters: [V.c3, V.c2, V.c4] });
    play(g);
    expect(pickableCardIds(g).sort()).toEqual([V.c2, V.c3].sort());

    const four = mk({}, { characters: [V.c4] });
    play(four);
    // Nothing eligible: the effect finds nothing to place, so no card is trashed either.
    expect(ids(four, 'p2', 'hand')).toEqual([V.c1, V.c2]);
    expect(ids(four, 'p2', 'trash')).toEqual([]);
    expect(atMain(four)).toBe(true);
    expect(ids(four, 'p2', 'characters')).toEqual([V.c4]);
    expect(four.life('p2')).toBe(3);
  });

  it("a Character that cannot be removed by your opponent's effects is not placed: the opponent trashes nothing", () => {
    const guard = {
      id: 'g',
      kind: 'permanent',
      apply: [
        {
          restrict: {
            target: { from: 'self', owner: 'you' },
            what: 'cannotBeRemovedByOpponentEffects',
          },
        },
      ],
    } as unknown as Ability;
    expectValid([guard]);
    const g = mk({}, { characters: [PURPLE] });
    g.state = withAbilities(g.state, PURPLE, [guard]);
    play(g);
    // The cost is asked and the end is asked before the removal is tried; the protection then stops it: the cost is not paid, so the effect does not resolve.
    option(g, 'top');
    expect(atMain(g)).toBe(true);
    expect(ids(g, 'p2', 'characters')).toEqual([PURPLE]);
    expect(g.life('p2')).toBe(3);
    expect(ids(g, 'p2', 'hand')).toEqual([V.c1, V.c2]);
    expect(ids(g, 'p2', 'trash')).toEqual([]);
  });

  it('with an empty hand the Character is still placed and nothing is trashed', () => {
    const g = mk({}, { hand: [] });
    play(g);
    // The only eligible Character is chosen: nothing to pick.
    option(g, 'top');
    expect(g.life('p2')).toBe(4);
    expect(ids(g, 'p2', 'trash')).toEqual([]);
    expect(atMain(g)).toBe(true);
  });

  it('W57-R1: the placement is a cost and may be declined: Kuzan is played, nothing is placed, nothing trashed', () => {
    const g = mk();
    playOnly(g);
    expectDecision(g, 'optional');
    expect(dec(g)!.player).toBe('p1');
    g.act({ type: 'optional', accept: false });
    expect(atMain(g)).toBe(true);
    expect(g.find('p1', 'characters', ID)).toBeTruthy();
    expect(g.life('p2')).toBe(3);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c3, V.c4]);
    expect(ids(g, 'p2', 'hand')).toEqual([V.c1, V.c2]);
    expect(ids(g, 'p2', 'trash')).toEqual([]);
  });

  it('W57-R1: with no Character of cost 3 or less the cost is not payable: no question, nothing happens', () => {
    const g = mk({}, { characters: [V.c4] });
    playOnly(g);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(atMain(g)).toBe(true);
  });
});
