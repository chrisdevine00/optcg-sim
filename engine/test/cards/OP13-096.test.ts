/** OP13-096 The Five Elders Are at Your Service!!! */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  hand,
  none,
  pick,
  play,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from './helpers.ts';
import { damageWith } from './triggers.ts';
import { canPick, CD2, mine, names } from './helpers-op13g4.ts';

const ID = 'OP13-096';
const FE = 'OP13-083';

const run = (deck: string[]) => {
  const g = mine({ leader: PLAIN_PURPLE, hand: [ID], deck }, {}, 1);
  play(g, ID);
  return g;
};

describe('OP13-096 The Five Elders Are at Your Service!!!', () => {
  it('[Main] takes 1 {Celestial Dragons} card from the top 3 and trashes the rest', () => {
    const g = run([BLUE, CD2, FE, V.c1]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', CD2)]);
    expect(hand(g, 'p1')).toEqual([CD2]);
    expect(names(g, 'p1', 'trash').sort()).toEqual([ID, BLUE, FE].sort());
    expect(names(g, 'p1', 'deck')).toEqual([V.c1]);
  });

  it('another copy of this Event is not offered (the name is excluded), other CD cards are', () => {
    const g = run([ID, CD2, FE, V.c1]);
    expect(canPick(g, g.find('p1', 'deck', ID))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', FE))).toBe(true);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('"up to 1": may take nothing; all 3 looked-at cards are trashed', () => {
    const g = run([CD2, FE, BLUE, V.c1]);
    none(g);
    expect(names(g, 'p1', 'trash')).toHaveLength(4);
    expect(names(g, 'p1', 'deck')).toEqual([V.c1]);
  });

  it('the 4th card of the deck is not looked at', () => {
    const g = run([BLUE, BLUE, BLUE, CD2]);
    expect(canPick(g, g.find('p1', 'deck', CD2))).toBe(false);
    none(g);
  });

  it('[Trigger] activates the [Main] effect', () => {
    const g = damageWith(ID, { leader: PLAIN_PURPLE, deck: [PURPLE, CD2, BLUE, V.c1] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'deck', CD2)]);
    expect(hand(g, 'p1')).toEqual([CD2]);
  });
});
