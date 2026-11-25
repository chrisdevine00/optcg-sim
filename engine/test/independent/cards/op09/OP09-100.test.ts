/**
 * OP09-100 Karasu (Character, Yellow, cost 3, 4000, Counter +1000, {Revolutionary Army}, Special).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.)
 * [Trigger] If your Leader has the "Revolutionary Army" type and you and your opponent have a total
 * of 5 or less Life cards, play this card."
 *
 * Rules: while a [Trigger] is being activated the Life card is in no area (CR 10-1-5-3), so it is not
 * counted; an activated [Trigger] whose condition fails sends the card to the trash (CR 10-1-5-3);
 * a [Trigger] play costs nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  attack,
  blockers,
  chr,
  describeRaTrigger,
  LD9,
  mine,
  need,
  onField,
  SC9,
  theirs,
  triggerGame,
} from './kit-op09c.ts';

const KARASU = 'OP09-100';

describeRaTrigger({ id: KARASU, cost: 3, power: 4000, counter: 1000 });

describe('OP09-100 Karasu: [Blocker]', () => {
  it('has the [Blocker] keyword', () => {
    const g = mine(LD9.rev, { characters: [KARASU] }, {});
    expect(g.card(chr(g, 'p1', KARASU)).keywords).toContain('Blocker');
  });

  it('can block an attack on my Leader', () => {
    const g = theirs(LD9.rev, { characters: [KARASU] }, { characters: [SC9.c3] });
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([chr(g, 'p1', KARASU)]);
  });

  it('a Karasu played by its [Trigger] is an active Blocker for the next attack of that turn', () => {
    const g = triggerGame(KARASU, { before: 3, p2Life: 2, p2: { characters: [SC9.c3] } });
    activateTrigger(g);
    expect(onField(g, KARASU)).toBe(true);
    expect(atMain(g, 'p2')).toBe(true);
    attack(g, chr(g, 'p2', SC9.c3), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([chr(g, 'p1', KARASU)]);
  });

  it('a Karasu in my hand is not a blocker: only a Character on the field blocks', () => {
    const g = theirs(LD9.rev, { hand: [KARASU] }, { characters: [SC9.c3] });
    attack(g, chr(g, 'p2', SC9.c3), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([]);
  });
});
