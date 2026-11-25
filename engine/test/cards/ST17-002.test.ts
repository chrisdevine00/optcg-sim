/** ST17-002 Trafalgar Law. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  dec,
  expectDecision,
  hand,
  none,
  pick,
  play,
  V,
} from './helpers.ts';
import { cardsIn, mk, PLAIN_PURPLE_LEADER, WARLORD_LEADER } from './helpers-prbst.ts';

const ID = 'ST17-002';

describe('ST17-002 Trafalgar Law', () => {
  const start = (leader: string = WARLORD_LEADER, p2chars: string[] = [V.c3, V.c4, V.c5]) =>
    mk({ leader, hand: [ID], characters: [V.c2] }, { characters: p2chars });

  it('[On Play]: return 1 of your Characters to hand: with a Warlord Leader, return a Character with cost 4 or less (5 is not a candidate)', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expectDecision(g, 'choose', 'p1');
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    // Law (cost 4) and the opponent's cost 3 and cost 4 Characters; not the cost 5 one.
    expect(offered.sort()).toEqual(
      [
        g.find('p1', 'characters', ID),
        g.find('p2', 'characters', V.c3),
        g.find('p2', 'characters', V.c4),
      ].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c3, V.c5]);
    expect(cardsIn(g, 'p2', 'hand')).toEqual([V.c4]);
  });

  it('"up to 1": the second return may be skipped, after the cost is paid', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    none(g);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c3, V.c4, V.c5]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });

  it('the cost may return Law himself (a Character of yours)', () => {
    const g = mk({ leader: WARLORD_LEADER, hand: [ID] }, { characters: [V.c3] });
    play(g, ID);
    accept(g);
    // Law is the only Character of yours: the cost is paid with him.
    expect(hand(g, 'p1')).toEqual([ID]);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(cardsIn(g, 'p2', 'hand')).toEqual([V.c3]);
  });

  it('must not fire: with a Leader that is not a Warlord the Character is returned as the cost and nothing else happens', () => {
    const g = start(PLAIN_PURPLE_LEADER);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c3, V.c4, V.c5]);
  });

  it('"you may": declined, nothing is returned', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([V.c2, ID]);
    expect(hand(g, 'p1')).toEqual([]);
    void BLUE;
  });
});
