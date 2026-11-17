/**
 * OP15-119 Monkey.D.Luffy (Character, Yellow, cost 5, 7000, no Counter, {Straw Hat Crew}/{Sky Island}).
 *
 * Card text: "If you have 6 or more DON!! cards on your field, this Character gains [Rush].
 * When your opponent activates an Event or [Blocker], reveal up to 1 card from the top of your Life
 * cards. This Character gains +1000 power during this turn per 1 cost on the revealed card."
 *
 * Rules: CR 10-2-8 ([Rush]), "DON!! cards on your field" = cost area (active and rested) plus given DON!!
 * (RL-48), CR 8-1-3-1 (auto effects), RL-09 ("during this turn"), revealing does not move the card.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, canAttack, endTurn, passBlock } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  canCounterWith,
  chooseIfAsked,
  kind,
  lifeCards,
  mine,
  playCard,
  RED,
  SC,
  settleYes,
  theirs,
  useCounter,
  VAN,
  YL,
  decider,
  settleNo,
} from './kit-a.ts';

const LUFFY = 'OP15-119';
const GUARD = 'OP15-078'; // Purple Event, cost 0: [Counter] +1000 during this battle, then maybe draw

describe('OP15-119 Monkey.D.Luffy: [Rush] with 6 or more DON!! on the field', () => {
  it('6 DON!! on the field (5 rested to pay + 1 more rested): can attack the turn it is played', () => {
    const g = mine(YL.shc, { hand: [LUFFY], costArea: { active: 5, rested: 1 } });
    playCard(g, LUFFY);
    const luffy = g.find('p1', 'characters', LUFFY);
    expect(g.card(luffy).keywords).toContain('Rush');
    expect(canAttack(g, luffy, g.leader('p2'))).toBe(true);
  });

  it('5 DON!! on the field: no [Rush], it cannot attack this turn', () => {
    const g = mine(YL.shc, { hand: [LUFFY], costArea: { active: 5, rested: 0 } });
    playCard(g, LUFFY);
    const luffy = g.find('p1', 'characters', LUFFY);
    expect(g.card(luffy).keywords).not.toContain('Rush');
    expect(canAttack(g, luffy, g.leader('p2'))).toBe(false);
  });

  it('DON!! given to Leader or Characters count: 5 in the cost area + 1 given = 6', () => {
    const g = mine({ card: YL.shc, don: 1 }, { hand: [LUFFY], costArea: { active: 5, rested: 0 } });
    playCard(g, LUFFY);
    const luffy = g.find('p1', 'characters', LUFFY);
    expect(g.card(luffy).keywords).toContain('Rush');
    expect(canAttack(g, luffy, g.leader('p2'))).toBe(true);
  });

  it('with 10 DON!! in play beforehand it has [Rush] too, and loses it when DON!! drop below 6', () => {
    const g = mine(YL.shc, { characters: [LUFFY], costArea: { active: 6, rested: 0 } });
    expect(g.card(g.find('p1', 'characters', LUFFY)).keywords).toContain('Rush');
    const h = mine(YL.shc, { characters: [LUFFY], costArea: { active: 5, rested: 0 } });
    expect(h.card(h.find('p1', 'characters', LUFFY)).keywords).not.toContain('Rush');
  });
});

describe('OP15-119 Monkey.D.Luffy: when the opponent activates an Event or [Blocker], reveal a Life card, +1000 per cost', () => {
  /** p1's Luffy attacks p2's Leader; p2 holds a [Blocker] and a Counter Event. */
  function attacking(life: string[], p2: object = {}) {
    const g = mine(
      YL.shc,
      { characters: [LUFFY], life, costArea: { active: 0, rested: 5 } },
      { characters: [SC.blocker], hand: [GUARD], costArea: { active: 1, rested: 0 }, ...p2 },
    );
    attack(g, g.find('p1', 'characters', LUFFY), g.leader('p2'));
    return g;
  }
  const luffyPower = (g: TestGame) => g.power(g.find('p1', 'characters', LUFFY));

  it('the opponent blocks with a [Blocker]: Luffy gets +1000 per cost of the revealed top Life card (cost 4: +4000)', () => {
    const g = attacking([VAN.hajrudin, RED, RED, RED]);
    act(g, { type: 'block', blocker: g.find('p2', 'characters', SC.blocker) });
    settleYes(g, 'p1');
    expect(luffyPower(g)).toBe(11000);
    // Revealing moves nothing.
    expect(g.life('p1')).toBe(4);
    expect(lifeCards(g)[0]).toBe(VAN.hajrudin);
  });

  it('the opponent activates an Event ([Counter]): +1000 per cost of the revealed card (cost 6: +6000)', () => {
    const g = attacking([VAN.thatch, RED, RED, RED]);
    passBlock(g);
    expect(kind(g)).toBe('counter');
    expect(decider(g)).toBe('p2');
    expect(canCounterWith(g, g.find('p2', 'hand', GUARD))).toBe(true);
    useCounter(g, g.find('p2', 'hand', GUARD), g.leader('p2'));
    chooseIfAsked(g, [g.leader('p2')]);
    settleYes(g, 'p1');
    expect(luffyPower(g)).toBe(13000);
  });

  it('a cost-2 revealed card gives +2000', () => {
    const g = attacking([VAN.sai, RED, RED, RED]);
    act(g, { type: 'block', blocker: g.find('p2', 'characters', SC.blocker) });
    settleYes(g, 'p1');
    expect(luffyPower(g)).toBe(9000);
  });

  it('a cost-1 revealed card gives only +1000', () => {
    const g = attacking([VAN.sunny, RED, RED, RED]);
    act(g, { type: 'block', blocker: g.find('p2', 'characters', SC.blocker) });
    settleYes(g, 'p1');
    expect(luffyPower(g)).toBe(8000);
  });

  it('with no Life cards there is nothing to reveal: no boost', () => {
    const g = attacking([]);
    act(g, { type: 'block', blocker: g.find('p2', 'characters', SC.blocker) });
    settleYes(g, 'p1');
    expect(luffyPower(g)).toBe(7000);
  });

  // DISAGREEMENTS-a.md A-3 (fixed in M4b fix round 1): the reveal is optional.
  it('CR 8-4-4-1: "reveal up to 1": revealing none leaves Luffy unboosted', () => {
    const g = attacking([VAN.hajrudin, RED, RED, RED]);
    act(g, { type: 'block', blocker: g.find('p2', 'characters', SC.blocker) });
    settleNo(g, 'p1');
    expect(luffyPower(g)).toBe(7000);
  });

  it('the boost lasts for the turn only', () => {
    const g = attacking([VAN.hajrudin, RED, RED, RED]);
    act(g, { type: 'block', blocker: g.find('p2', 'characters', SC.blocker) });
    settleYes(g, 'p1');
    expect(luffyPower(g)).toBe(11000);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    endTurn(g);
    expect(luffyPower(g)).toBe(7000);
  });

  it('my OWN Event or [Blocker] does not trigger it (only the opponent’s activations count)', () => {
    const g = theirs(
      YL.shc,
      {
        characters: [LUFFY, SC.blocker],
        hand: [GUARD],
        life: [VAN.hajrudin, RED, RED, RED],
        costArea: { active: 1, rested: 0 },
      },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    act(g, { type: 'block', blocker: g.find('p1', 'characters', SC.blocker) });
    expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(7000);
    expect(kind(g)).not.toBe('optional');
  });
});
