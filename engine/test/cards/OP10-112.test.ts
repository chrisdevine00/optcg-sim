/** OP10-112 Eustass"Captain"Kid. */
import { describe, expect, it } from 'vitest';
import { accept, dec, decline, expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { cardsOf, start } from './helpers-a10g4.ts';

const ID = 'OP10-112';

/** Kid is on p1's board (active); the opponent has `life` Life cards. */
const board = (oppLife: string[], p1hand: string[] = [V.c1, V.c2]) =>
  start({ characters: [ID], hand: p1hand, deck: [V.c3, V.c4, V.c5] }, { life: oppLife });

describe('OP10-112 Eustass"Captain"Kid', () => {
  it("[On Play]: resting this Character trashes the top of the opponent's Life (face up, not damage)", () => {
    const g = start({ hand: [ID] }, { life: [V.c2, V.c3, V.c4] });
    play(g, ID);
    accept(g); // pay: rest this Character
    accept(g); // "up to 1"
    expect(cardsOf(g, 'p2', 'life')).toEqual([V.c3, V.c4]);
    expect(trash(g, 'p2')).toEqual([V.c2]);
    expect(g.zone('p1', 'characters')[0]!.rested).toBe(true);
    expect(g.eventsOfType('DamageDealt')).toHaveLength(0);
    expect(dec(g)?.kind).toBe('main');
  });

  it('[On Play]: "up to 1" may trash nothing, and declining the rest cost does nothing', () => {
    const g = start({ hand: [ID] }, { life: [V.c2, V.c3] });
    play(g, ID);
    accept(g);
    decline(g); // trash 0
    expect(g.life('p2')).toBe(2);
    expect(g.zone('p1', 'characters')[0]!.rested).toBe(true); // the cost is paid either way
    const h = start({ hand: [ID] }, { life: [V.c2, V.c3] });
    play(h, ID);
    decline(h);
    expect(h.life('p2')).toBe(2);
    expect(h.zone('p1', 'characters')[0]!.rested).toBe(false);
  });

  it('[End of Your Turn]: with 2 Life cards the opponent has, draw 1 then trash 1 from your hand (boundary 2)', () => {
    const g = board([V.c2, V.c3]);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2, V.c3]); // drew the top card
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toEqual([V.c2, V.c3]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it('[End of Your Turn]: with 0 Life cards it still applies', () => {
    const g = board([]);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
  });

  it('[End of Your Turn] must not fire with 3 Life cards: nothing is drawn or trashed', () => {
    const g = board([V.c2, V.c3, V.c4]);
    g.act({ type: 'endTurn' });
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
    expect(trash(g, 'p1')).toEqual([]);
    expect(dec(g)?.player).not.toBe('p1');
  });
});
