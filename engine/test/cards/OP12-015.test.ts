/** OP12-015 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  dec,
  decline,
  don,
  expectDecision,
  game,
  none,
  pick,
  play,
  PLAIN_BLUE,
} from './helpers.ts';
import { cardsOf, donArea, EVENTS, RED_3000, SHC, SHC_LEADER } from './helpers-luffyace.ts';

const ID = 'OP12-015';

describe('OP12-015 Monkey.D.Luffy', () => {
  it('[permanent]: +2000 power with a total of 2 or more given DON!! cards (any of your Leader and Characters)', () => {
    const power = (leaderDon: number, lufDon: number, otherDon: number) => {
      const g = game(
        {
          leader: { card: SHC_LEADER, don: leaderDon },
          characters: [
            { card: ID, don: lufDon },
            { card: SHC.franky4, don: otherDon },
          ],
        },
        { leader: PLAIN_BLUE },
      );
      return g.power(g.find('p1', 'characters', ID));
    };
    // Printed 4000, +1000 per DON!! given to it on your turn.
    expect(power(0, 0, 0)).toBe(4000);
    expect(power(1, 0, 0)).toBe(4000); // only 1 given in total
    expect(power(1, 1, 0)).toBe(4000 + 1000 + 2000); // 2 in total
    expect(power(0, 0, 2)).toBe(4000 + 2000); // given to another card still counts
    expect(power(0, 2, 0)).toBe(4000 + 2000 + 2000);
  });

  it("[permanent]: the opponent's given DON!! do not count", () => {
    const g = game(
      { leader: SHC_LEADER, characters: [ID] },
      { leader: { card: PLAIN_BLUE, don: 3 } },
    );
    expect(g.power(g.find('p1', 'characters', ID))).toBe(4000);
  });

  const start = (extraHand: string[] = []) =>
    game(
      {
        leader: SHC_LEADER,
        hand: [ID, ...EVENTS, RED_3000, SHC.jinbe2, BLUE, ...extraHand],
        ...donArea(4, 1),
      },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: reveal 2 Events, play a red Character with 3000 power or less, then give 1 rested DON!!', () => {
    const g = start();
    play(g, ID);
    accept(g);
    // Reveal the two Events (a hidden pool, so the choice is asked).
    pick(g, [g.find('p1', 'hand', EVENTS[0]), g.find('p1', 'hand', EVENTS[1])]);
    expect(
      g
        .eventsOfType('CardRevealed')
        .map((e) => e.card)
        .slice(-2)
        .sort(),
    ).toEqual([...EVENTS].sort());
    // Only the red 3000-power Character qualifies (not the 4000 one, not the Blue 3000 one).
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.max).toBe(1);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'hand', RED_3000)]);
    expect(cardsOf(g, 'p1', 'characters').sort()).toEqual([ID, RED_3000].sort());
    // The Events stay in the hand.
    expect(cardsOf(g, 'p1', 'hand')).toEqual(expect.arrayContaining([...EVENTS]));
    // Then: a rested DON!! to the Leader or one of the Characters.
    expectDecision(g, 'choose', 'p1');
    const target = g.find('p1', 'characters', RED_3000);
    pick(g, [target]);
    expect(g.card(target).don).toBe(1);
    expect(don(g, 'p1').rested).toBe(5 - 1);
  });

  it('[On Play]: declining the optional cost does nothing at all', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(don(g, 'p1').rested).toBe(5);
    expectDecision(g, 'main', 'p1');
  });

  it('[On Play]: not offered with fewer than 2 Events in hand', () => {
    const g = game(
      { leader: SHC_LEADER, hand: [ID, EVENTS[0], RED_3000], ...donArea(4, 1) },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    // The decision may be shown, but "use" is unavailable (the cost cannot be paid, CR 8-3-1-3).
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(dec(g)?.kind).toBe('main');
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('[On Play]: "Then, give" is not conditioned on the play (no eligible Character still gives the DON!!)', () => {
    const g = game(
      { leader: SHC_LEADER, hand: [ID, ...EVENTS, SHC.jinbe2], ...donArea(4, 1) },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', EVENTS[0]), g.find('p1', 'hand', EVENTS[1])]);
    // Nothing to play: the (empty) hidden choice is asked, then the DON!! goes out.
    none(g);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });
});
