/** PRB02-007 Jinbe. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play, times, V } from './helpers.ts';
import { cardsIn, mk, orderAll, WARLORD6, WARLORD8 } from './helpers-prbst.ts';

const ID = 'PRB02-007';

describe('PRB02-007 Jinbe', () => {
  // Top 5: a Warlord, another [Jinbe], a vanilla, a Warlord, a vanilla; the 6th is a Warlord too.
  const top5 = [WARLORD6, ID, V.c1, WARLORD8, V.c2];
  const deck = [...top5, WARLORD8, ...times(4, BLUE)];

  it('[On Play]: looks at 5 and offers {The Seven Warlords of the Sea} cards other than [Jinbe]', () => {
    const g = mk({ hand: [ID], deck });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(offered.sort()).toEqual(
      [g.find('p1', 'deck', WARLORD6), g.find('p1', 'deck', WARLORD8)].sort(),
    );
    pick(g, [g.find('p1', 'deck', WARLORD8)]);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([WARLORD8]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(WARLORD8);
    const d = cardsIn(g, 'p1', 'deck');
    expect(d).toHaveLength(deck.length - 1);
    expect(d[0]).toBe(WARLORD8); // the 6th card was not looked at
    expect(d.slice(-4).sort()).toEqual([WARLORD6, ID, V.c1, V.c2].sort());
  });

  it('"up to 1": may take nothing; all 5 go to the bottom', () => {
    const g = mk({ hand: [ID], deck });
    play(g, ID);
    none(g);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsIn(g, 'p1', 'deck').slice(-5).sort()).toEqual([...top5].sort());
  });

  it("[When Attacking]: places a Character with cost 1 (boundary) of either side at the bottom of its owner's deck", () => {
    const g = mk({ characters: [ID, V.c1] }, { characters: [V.c1, V.c2] });
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expectDecision(g, 'choose', 'p1');
    // Cost 1: p1's and p2's V.c1. Cost 2 and Jinbe (cost 4) are not candidates.
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(offered.sort()).toEqual(
      [g.find('p1', 'characters', V.c1), g.find('p2', 'characters', V.c1)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c2]);
    expect(cardsIn(g, 'p2', 'deck').at(-1)).toBe(V.c1);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID, V.c1]);
  });

  it('[When Attacking]: your own Character goes to the bottom of your deck, and "up to 1" may be skipped', () => {
    const g = mk({ characters: [ID, V.c1] }, {});
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(cardsIn(g, 'p1', 'deck').at(-1)).toBe(V.c1);
    const h = mk({ characters: [ID, V.c1] }, {});
    h.act({ type: 'attack', attacker: h.find('p1', 'characters', ID), target: h.leader('p2') });
    none(h);
    expect(cardsIn(h, 'p1', 'characters')).toEqual([ID, V.c1]);
  });

  it('must not fire: with no Character of cost 1 or less nothing can be chosen', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c2] });
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    // Either no prompt or an empty one: the opponent's cost 2 Character stays.
    while (g.legal().some((a) => a.type === 'done')) g.act({ type: 'done' });
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c2]);
  });
});
