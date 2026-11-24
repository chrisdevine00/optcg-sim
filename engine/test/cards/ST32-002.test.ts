/** ST32-002 Kouzuki Oden. */
import { describe, expect, it } from 'vitest';
import { BLUE, game, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { canAttack, donArea, offeredPicks, SLASH_LEADER } from './helpers-stg1.ts';

const ID = 'ST32-002';

const start = (opp: Parameters<typeof game>[1]['characters']) =>
  game(
    { leader: SLASH_LEADER, hand: [ID], deck: [BLUE, BLUE, BLUE], ...donArea(5) },
    { leader: PLAIN_BLUE, characters: opp },
  );
/** The effect resolved; hand over to p2's turn. */
const toOpponentsTurn = (g: ReturnType<typeof start>) => g.act({ type: 'endTurn' });

describe('ST32-002 Kouzuki Oden', () => {
  it("[On Play]: draw 1 card and up to 1 of your opponent's Characters with a base cost of 6 or less cannot be rested until the end of your opponent's next End Phase", () => {
    const g = start([V.c6, V.c2]);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    toOpponentsTurn(g);
    // p2's turn: the chosen Character cannot attack (an attack rests it); the other can.
    expect(canAttack(g, g.find('p2', 'characters', V.c6), g.leader('p1'), 'p2')).toBe(false);
    expect(canAttack(g, g.find('p2', 'characters', V.c2), g.leader('p1'), 'p2')).toBe(true);
  });

  it('the restriction ends with the end of that opponent turn: it can attack on the following turn', () => {
    const g = start([V.c6]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    toOpponentsTurn(g); // p2's turn
    g.act({ type: 'endTurn' }); // p2 -> p1
    g.act({ type: 'endTurn' }); // p1 -> p2
    expect(canAttack(g, g.find('p2', 'characters', V.c6), g.leader('p1'), 'p2')).toBe(true);
  });

  it('a base cost of 7 is not a candidate, a base cost of 6 is (exact boundary)', () => {
    const g = start([V.c7, V.c6]);
    play(g, ID);
    expect(offeredPicks(g)).toEqual([g.find('p2', 'characters', V.c6)]);
    none(g);
  });

  it('"up to 1": choosing none restricts nothing, and the card is still drawn', () => {
    const g = start([V.c6]);
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    toOpponentsTurn(g);
    expect(canAttack(g, g.find('p2', 'characters', V.c6), g.leader('p1'), 'p2')).toBe(true);
  });

  it('with no opposing Character the draw still happens', () => {
    const g = start([]);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });
});
