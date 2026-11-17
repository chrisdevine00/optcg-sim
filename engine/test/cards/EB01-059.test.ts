/** EB01-059 Kingdom Come. QA-EB01 EB01-059: the [Trigger] total counts Life without the Trigger card. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, none, pick, play, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { ENEL, ids, triggerHit } from './helpers-robin.ts';

const KC = 'EB01-059';

describe('EB01-059 Kingdom Come', () => {
  const setup = (life: string[]) =>
    game(
      { leader: ENEL, hand: [KC], life, costArea: { active: 6, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c7, V.c3] },
    );

  it('[Main] K.O. up to 1 Character (any cost), then trash cards from the top of your Life until you have 1', () => {
    const g = setup([V.c1, PURPLE, BLUE, V.c2]);
    play(g, KC);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c7]);
    // Life trashed from the top: the bottom card stays.
    expect(ids(g, 'p1', 'life')).toEqual([V.c2]);
    expect(ids(g, 'p1', 'trash')).toEqual([BLUE, PURPLE, V.c1, KC]);
  });

  it('[Main] "Then": Life is trashed down to 1 even when nothing is K.O.d', () => {
    const g = setup([V.c1, PURPLE, BLUE]);
    play(g, KC);
    none(g);
    expect(g.life('p1')).toBe(1);
    expect(ids(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('[Main] with 1 Life (or 0) nothing is trashed', () => {
    const g = setup([V.c1]);
    play(g, KC);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.life('p1')).toBe(1);
    expect(ids(g, 'p1', 'trash')).toEqual([KC]);
  });

  it("[Trigger] K.O. a Character with a cost of at most the total of both players' Life", () => {
    // After the hit p1 has 1 Life (PURPLE) and p2 has 3: the total is 4.
    const g = triggerHit(KC, {}, [V.c4, V.c5]);
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    // The cost 4 Character is a target; cost 5 is not (the [Trigger] card itself is not Life: QA-EB01).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c4]);
    expect(ids(g, 'p2', 'characters')).toContain(V.c5);
  });
});
