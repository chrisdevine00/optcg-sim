/** PRB02-013 Gecko Moria. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, don, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { cardsIn, mk, PLAIN_PURPLE_LEADER, TBP_LEADER } from './helpers-prbst.ts';

const ID = 'PRB02-013';

describe('PRB02-013 Gecko Moria', () => {
  const start = (
    leader: string,
    trash: string[] = [V.c4, V.c5, V.c2],
    costArea = { active: 6, rested: 0 },
  ) => mk({ leader, hand: [ID, BLUE], trash, costArea });

  it('[On Play]: with a {Thriller Bark Pirates} Leader, plays a cost 4 or less Character from the trash rested, then gives a rested DON!!', () => {
    const g = start(TBP_LEADER);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    // Cost 4 and 2 qualify; cost 5 does not.
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(offered.sort()).toEqual(
      [g.find('p1', 'trash', V.c4), g.find('p1', 'trash', V.c2)].sort(),
    );
    pick(g, [g.find('p1', 'trash', V.c4)]);
    const played = g.find('p1', 'characters', V.c4);
    expect(g.card(played).rested).toBe(true);
    // Then: one rested DON!! to the Leader or a Character (the played one included).
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    pick(g, [played]);
    expect(g.card(played).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ rested: 5, given: 1 });
  });

  it('"up to 1": the play may be skipped, and the DON!! is still given', () => {
    const g = start(TBP_LEADER);
    play(g, ID);
    none(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('must not fire: with another Leader nothing is played and no DON!! is given ("Then" is inside the guard)', () => {
    const g = start(PLAIN_PURPLE_LEADER);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    expect(don(g, 'p1')).toMatchObject({ rested: 6, given: 0 });
    expect(cardsIn(g, 'p1', 'trash')).toEqual([V.c4, V.c5, V.c2]);
  });

  it('"up to 1": the DON!! may be left (None) after the Character is played', () => {
    const g = start(TBP_LEADER, [V.c4]);
    play(g, ID);
    pick(g, [g.find('p1', 'trash', V.c4)]);
    expectDecision(g, 'choose', 'p1');
    none(g);
    expect(don(g, 'p1')).toMatchObject({ rested: 6, given: 0 });
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID, V.c4]);
  });

  it('an empty trash plays nothing; the give still resolves', () => {
    const g = start(TBP_LEADER, []);
    play(g, ID);
    // The play had no candidate, so the first prompt is the give.
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });
});
