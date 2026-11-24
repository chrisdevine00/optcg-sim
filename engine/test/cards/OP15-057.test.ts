/** OP15-057 Dressrosa Kingdom. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  endCounter,
  expectDecision,
  hand,
  none,
  passBlock,
  pick,
  play,
  takeDamage,
  V,
} from './helpers.ts';
import {
  EVENT,
  EVENT2,
  idsOf,
  LUCY,
  mine,
  oppAttack,
  OTHER_LEADER,
  STAGE,
} from './helpers-op15g2.ts';

const ID = 'OP15-057';

describe('OP15-057 Dressrosa Kingdom', () => {
  it('[On Play] with a {Dressrosa} Leader, draw 1 card', () => {
    const g = mine(LUCY, { hand: [ID], deck: [V.c1, V.c2] });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('[On Play] without a {Dressrosa} Leader nothing is drawn', () => {
    const g = mine(OTHER_LEADER, { hand: [ID], deck: [V.c1, V.c2] });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'stage')).toEqual([ID]);
  });

  const attacked = (handCards: string[], stage: string | { card: string; rested: boolean } = ID) =>
    oppAttack({ leader: LUCY, stage, hand: handCards });

  it("[On Your Opponent's Attack] rest this Stage and trash an Event or Stage from hand: +2000 power to a Leader or Character this battle", () => {
    const g = attacked([EVENT, V.c1]);
    accept(g);
    pick(g, [g.find('p1', 'hand', EVENT)]);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
    expect(idsOf(g, 'p1', 'trash')).toEqual([EVENT]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    // The boost lasted only for the battle.
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Stage card from hand pays the cost too, and only Event or Stage cards are candidates', () => {
    const g = attacked([STAGE, EVENT2, V.c1]);
    accept(g);
    const picks = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(picks).toHaveLength(2);
    expect(picks).not.toContain(g.find('p1', 'hand', V.c1));
    pick(g, [g.find('p1', 'hand', STAGE)]);
    none(g);
    expect(idsOf(g, 'p1', 'trash')).toEqual([STAGE]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('may be declined: the Stage stays active and the hand is kept', () => {
    const g = attacked([EVENT]);
    decline(g);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(false);
    expect(hand(g, 'p1')).toEqual([EVENT]);
    expectDecision(g, 'block', 'p1');
  });

  it('a Character may receive the +2000 instead of the Leader', () => {
    const g = oppAttack({ leader: LUCY, stage: ID, hand: [EVENT], characters: [V.c1] });
    accept(g);
    pick(g, [g.find('p1', 'hand', EVENT)]);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a rested Stage cannot pay the rest cost', () => {
    const g = attacked([EVENT], { card: ID, rested: true });
    if (dec(g)?.kind === 'optional') {
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(g);
    }
    expect(hand(g, 'p1')).toEqual([EVENT]);
  });

  it('without an Event or Stage in hand the cost cannot be paid', () => {
    const g = attacked([V.c1]);
    if (dec(g)?.kind === 'optional') {
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(g);
    }
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(false);
  });
});
