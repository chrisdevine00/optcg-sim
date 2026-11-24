/** EB05-047 Ripley: This Character gains +12 cost. [On Play] You may trash 1 card from your hand: Play up to 1 Character card with a cost of 2 or less from your trash. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  none,
  pick,
  play,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { ids } from './helpers-robin.ts';

const RIPLEY = 'EB05-047';

describe('EB05-047 Ripley', () => {
  const setup = (handExtra: string[], trashCards: string[]) =>
    game(
      {
        leader: PLAIN_PURPLE,
        hand: [RIPLEY, ...handExtra],
        trash: trashCards,
        costArea: { active: 4, rested: 0 },
      },
      { leader: PLAIN_PURPLE },
    );

  it('has +12 cost on the field (16) and its printed cost in hand', () => {
    const g = setup([], []);
    expect(g.card(g.find('p1', 'hand', RIPLEY)).cost).toBe(4);
    play(g, RIPLEY);
    expect(g.card(g.find('p1', 'characters', RIPLEY)).cost).toBe(16);
  });

  it('[On Play] trash 1 card: plays the chosen Character with a cost of 2 or less from the trash', () => {
    const g = setup([BLUE], [V.c1, V.c3, V.c2]);
    play(g, RIPLEY);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    // Only cost 2 or less: the cost 3 Character is not offered (the cost card, BLUE, is cost 1 and is).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    pick(g, [g.find('p1', 'trash', V.c2)]);
    expect(ids(g, 'p1', 'characters').sort()).toEqual([RIPLEY, V.c2].sort());
    expect(ids(g, 'p1', 'trash').sort()).toEqual([BLUE, V.c1, V.c3].sort());
  });

  it('[On Play] the card just trashed as the cost may itself be played back', () => {
    const g = setup([BLUE], []);
    play(g, RIPLEY);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    pick(g, [g.find('p1', 'trash', BLUE)]);
    expect(ids(g, 'p1', 'characters').sort()).toEqual([BLUE, RIPLEY].sort());
  });

  it('[On Play] "up to 1": may play nothing after paying', () => {
    const g = setup([BLUE], [V.c1]);
    play(g, RIPLEY);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([RIPLEY]);
  });

  it('[On Play] the cost may be declined, and cannot be paid with an empty hand', () => {
    const g = setup([BLUE], [V.c1]);
    play(g, RIPLEY);
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([RIPLEY]);
    expect(ids(g, 'p1', 'hand')).toEqual([BLUE]);

    const h = setup([], [V.c1]);
    play(h, RIPLEY);
    expectDecision(h, 'optional', 'p1');
    expect(h.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    decline(h);
    expect(ids(h, 'p1', 'characters')).toEqual([RIPLEY]);
  });
});
