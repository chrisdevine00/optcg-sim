/** ST20-004 Charlotte Pudding. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  endCounter,
  expectDecision,
  hand,
  none,
  passBlock,
  pick,
  play,
  PURPLE,
  V,
} from './helpers.ts';
import { BMP2, BMP4, isRested, mk, offered } from './helpers-st1821.ts';

const ID = 'ST20-004';

const rested = (card: string) => ({ card, rested: true });

describe('ST20-004 Charlotte Pudding', () => {
  it('[On Play]: adds the top Life card to the hand, then sets a {Big Mom Pirates} Character of cost 3 or less as active', () => {
    const g = mk({
      hand: [ID],
      life: [BLUE, BLUE, BLUE],
      characters: [rested(BMP2), rested(BMP4), rested(V.c2)],
    });
    play(g, ID);
    accept(g);
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expectDecision(g, 'choose', 'p1');
    // Cost 2 {BMP} and Pudding herself (cost 3, {BMP}) are candidates; cost 4 {BMP} and a non-{BMP} are not.
    expect(offered(g).sort()).toEqual(
      [g.find('p1', 'characters', BMP2), g.find('p1', 'characters', ID)].sort(),
    );
    pick(g, [g.find('p1', 'characters', BMP2)]);
    expect(isRested(g, g.find('p1', 'characters', BMP2))).toBe(false);
    expect(isRested(g, g.find('p1', 'characters', BMP4))).toBe(true);
    expect(isRested(g, g.find('p1', 'characters', V.c2))).toBe(true);
  });

  it('declining the cost: no Life moves and nothing is set active', () => {
    const g = mk({ hand: [ID], life: [BLUE, BLUE, BLUE], characters: [rested(BMP2)] });
    play(g, ID);
    decline(g);
    expect(g.life('p1')).toBe(3);
    expect(hand(g, 'p1')).toEqual([]);
    expect(isRested(g, g.find('p1', 'characters', BMP2))).toBe(true);
  });

  it('with no Life cards the cost cannot be paid', () => {
    const g = mk({ hand: [ID], life: [], characters: [rested(BMP2)] });
    play(g, ID);
    // Life is public: with none the cost is unpayable and no prompt is shown.
    expectDecision(g, 'main', 'p1');
    expect(isRested(g, g.find('p1', 'characters', BMP2))).toBe(true);
  });

  it('"up to 1": the set-active may be declined', () => {
    const g = mk({ hand: [ID], life: [BLUE, BLUE], characters: [rested(BMP2)] });
    play(g, ID);
    accept(g);
    none(g);
    expect(isRested(g, g.find('p1', 'characters', BMP2))).toBe(true);
    expect(g.life('p1')).toBe(1);
  });

  it("[Trigger]: rests up to 1 of the opponent's Characters with a cost of 3 or less (4 is not offered)", () => {
    const g = mk(
      { life: [ID, BLUE, BLUE] },
      { characters: [V.c4, V.c3, V.c2], life: [PURPLE, PURPLE, PURPLE] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: true });
    expect(offered(g).sort()).toEqual(
      [g.find('p2', 'characters', V.c3), g.find('p2', 'characters', V.c2)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(isRested(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(isRested(g, g.find('p2', 'characters', V.c2))).toBe(false);
  });
});
