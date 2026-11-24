/**
 * ST29-005 Jinbe (Character, Yellow, cost 6, 5000, Counter +2000, {Fish-Man}/{Straw Hat Crew}/{Egghead}).
 *
 * Card text: no effect text. "[Trigger] If your Leader is [Monkey.D.Luffy], play this card."
 *
 * Rules: [Trigger] activates only when the card is taken as damage (CR 10-1-5); the "If" looks at
 * the controller's own Leader name; an activated Trigger that does not play the card ends in the
 * trash; playing into a full Character area forces a trash (CR 3-7-6). With no effect text, playing
 * it from hand asks nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  don,
  describeLuffyTrigger,
  hand,
  ids29,
  inst,
  isMain,
  kind,
  L29,
  mine,
  playRaw,
} from './kit-st29a.ts';

const ID = 'ST29-005';

describeLuffyTrigger({ id: ID, cost: 6, power: 5000, counter: 2000 });

describe('ST29-005 Jinbe: no effect when played from hand', () => {
  it('playing it from hand costs 6 and asks nothing (the [Trigger] is not an [On Play])', () => {
    const g = mine(L29.luffy, { hand: [ID], costArea: { active: 6, rested: 0 } });
    playRaw(g, ID);
    expect(kind(g)).toBe('main');
    expect(isMain(g, 'p1')).toBe(true);
    expect(ids29(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g)).toEqual([]);
    expect(g.card(inst(g, 'p1', 'characters', ID)).power).toBe(5000);
    expect(don(g)).toMatchObject({ active: 0, rested: 6 });
  });
});
