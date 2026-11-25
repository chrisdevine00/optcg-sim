/** OP10-109 Basil Hawkins. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  dec,
  decline,
  endCounter,
  expectDecision,
  game,
  hand,
  idsOf,
  koBy,
  koedInBattle,
  mk,
  OTHER_LEADER,
  passBlock,
  pick,
  PLAIN_BLUE,
  rep,
  trash,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-109';
const THEIR_LIFE = [V.c5, V.c6, V.c7];

describe('OP10-109 Basil Hawkins: [On K.O.]', () => {
  it("trashes the top card of your opponent's Life", () => {
    const g = mk({ characters: [ID] }, { life: THEIR_LIFE });
    koBy(g, 'p1', ID, 'p2');
    accept(g);
    expect(idsOf(g, 'p2', 'life')).toEqual([V.c6, V.c7]);
    expect(trash(g, 'p2')).toEqual([V.c5]);
    expect(hand(g, 'p2')).toEqual([]);
    expectDecision(g, 'main', 'p1');
  });

  it("works when it is K.O.'d in battle", () => {
    const g = koedInBattle(ID, { leader: OTHER_LEADER }, { life: THEIR_LIFE });
    accept(g);
    expect(g.life('p2')).toBe(2);
    expect(trash(g, 'p2')).toEqual([V.c5]);
  });

  it('is not damage: a [Trigger] on the trashed Life card does not activate', () => {
    const g = mk(
      { characters: [ID] },
      { life: [ID, V.c6], hand: [V.c1], deck: [V.c2, V.c3, V.c4] },
    );
    koBy(g, 'p1', ID, 'p2');
    accept(g);
    expect(dec(g)?.kind).toBe('main');
    expect(trash(g, 'p2')).toEqual([ID]);
    expect(hand(g, 'p2')).toEqual([V.c1]); // no "draw 2" happened
  });

  it('"up to 1": may be declined, and nothing is trashed', () => {
    const g = mk({ characters: [ID] }, { life: THEIR_LIFE });
    koBy(g, 'p1', ID, 'p2');
    decline(g);
    expect(g.life('p2')).toBe(3);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('with no Life cards it trashes nothing', () => {
    const g = mk({ characters: [ID] }, { life: [] });
    koBy(g, 'p1', ID, 'p2');
    if (dec(g)?.kind === 'optional') decline(g);
    expect(trash(g, 'p2')).toEqual([]);
    expect(dec(g)?.kind).toBe('main');
  });

  it('never touches your own Life', () => {
    const g = mk({ characters: [ID], life: rep(3, V.c1) }, { life: THEIR_LIFE });
    koBy(g, 'p1', ID, 'p2');
    accept(g);
    expect(g.life('p1')).toBe(3);
    expect(g.life('p2')).toBe(2);
  });
});

describe('OP10-109 Basil Hawkins: [Trigger]', () => {
  it('draw 2 cards and trash 1 card from your hand', () => {
    const g = game(
      { leader: OTHER_LEADER, life: [ID, V.c1], hand: [V.c2], deck: [V.c3, V.c4, V.c5] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    // the hand now holds V.c2 and the 2 drawn cards; the player chooses which to trash
    expect(hand(g, 'p1')).toHaveLength(3);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toEqual([V.c3, V.c4]);
    expect(trash(g, 'p1')).toContain(V.c2);
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c5]);
  });
});
