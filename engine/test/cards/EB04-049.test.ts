/** EB04-049 Finger Pistol Yellow Lotus: [Main] you may trash 2 cards from the top of your deck: K.O. up to 1 of the opponent's Characters with a base cost of 5 or less; [Trigger] activate this card's [Main] effect. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, ids, mine, OTHER_LEADER, plant, triggerHit } from './helpers-eb04g2.ts';

const ID = 'EB04-049';

const setup = (theirs: string[], deck = [V.c1, V.c2, V.c3, V.c4]) =>
  mine({ leader: OTHER_LEADER, hand: [ID], deck }, { characters: theirs });

describe('EB04-049 Finger Pistol Yellow Lotus', () => {
  it('trash 2 from the top of the deck: K.O. a Character with a base cost of 5 or less (cost 6 is not a target)', () => {
    const g = setup([V.c5, V.c6]);
    play(g, ID);
    accept(g);
    expect(ids(g, 'p1', 'trash')).toEqual([V.c2, V.c1, ID]);
    expect(ids(g, 'p1', 'deck')).toEqual([V.c3, V.c4]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c6]);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c5]);
  });

  it('the limit is the base cost: a cost 5 Character raised to 7 is still a target, a base cost 7 one is not', () => {
    const g = setup([V.c5, V.c7]);
    plant(g, 'p1', {
      cost: { target: { from: 'characters', owner: 'opponent' }, amount: 2, duration: 'thisTurn' },
    });
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(7);
    play(g, ID);
    accept(g);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false);
    none(g);
  });

  it('"up to 1": the cost is paid and nothing is K.O.d when none is chosen', () => {
    const g = setup([V.c5]);
    play(g, ID);
    accept(g);
    none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
    expect(ids(g, 'p1', 'deck')).toHaveLength(2);
  });

  it('the "you may" cost can be declined: nothing is trashed and nothing is K.O.d', () => {
    const g = setup([V.c5]);
    play(g, ID);
    decline(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
    expect(ids(g, 'p1', 'deck')).toHaveLength(4);
  });

  it('with fewer than 2 cards in the deck the cost cannot be paid (an Event asks, but only decline is legal)', () => {
    const g = setup([V.c5], [V.c1]);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
    expect(ids(g, 'p1', 'deck')).toEqual([V.c1]);
  });

  it("[Trigger] activates this card's [Main]: the optional cost is asked, then the K.O.", () => {
    const g = triggerHit(ID, { deck: [V.c1, V.c2, V.c3] }, [V.c5]);
    g.act({ type: 'trigger', activate: true });
    accept(g);
    expect(ids(g, 'p1', 'trash')).toContain(V.c1);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c7]);
  });
});
