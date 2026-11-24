/** ST30-008 Marco. */
import { describe, expect, it } from 'vitest';
import { accept, decline, game, hand, PLAIN_BLUE, pick, trash } from './helpers.ts';
import { ACE6, ATMOS, EVENT, ids, koInBattle, P5000, P7000, SHC_LEADER } from './helpers-stg1.ts';

const ID = 'ST30-008';

const koed = (h: string[]) =>
  koInBattle({ leader: SHC_LEADER, hand: h, characters: [{ card: ID, rested: true }] }, ID);

describe('ST30-008 Marco', () => {
  it('has [Blocker]', () => {
    const g = game({ leader: SHC_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On K.O.]: you may trash 1 Character card with 6000 power from your hand: play this Character from your trash rested', () => {
    const g = koed([ATMOS]);
    accept(g);
    pick(g, [g.find('p1', 'hand', ATMOS)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(trash(g, 'p1')).toEqual([ATMOS]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('declining leaves Marco in the trash and the hand untouched', () => {
    const g = koed([ATMOS]);
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([ATMOS]);
  });

  it('5000 and 7000 Characters and Events are not 6000-power Characters: the cost cannot be paid', () => {
    const g = koed([P5000, P7000, EVENT]);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it('the cost takes exactly 1 of the 6000 Characters', () => {
    const g = koed([ATMOS, ACE6]);
    accept(g);
    pick(g, [g.find('p1', 'hand', ACE6)]);
    expect(trash(g, 'p1')).toEqual([ACE6]);
    expect(hand(g, 'p1')).toEqual([ATMOS]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });
});
