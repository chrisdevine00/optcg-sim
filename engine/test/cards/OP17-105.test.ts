/** OP17-105 Charlotte Chiffon. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  trash,
} from './helpers.ts';
import { NO_TRIGGER, WITH_TRIGGER } from './helpers-op17g3.ts';

const ID = 'OP17-105';
const start = (handCards: string[], opp: string[]) =>
  game(
    { leader: PLAIN_PURPLE, hand: [ID, ...handCards], costArea: { active: 5, rested: 0 } },
    { leader: PLAIN_BLUE, characters: opp },
  );

describe('OP17-105 Charlotte Chiffon', () => {
  it("[On Play] trash 1 card with a [Trigger]: returns up to 1 opposing Character with a [Trigger] to the owner's hand", () => {
    const g = start([WITH_TRIGGER, BLUE], [WITH_TRIGGER, NO_TRIGGER]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', WITH_TRIGGER)]);
    pick(g, [g.find('p2', 'characters', WITH_TRIGGER)]);
    expect(trash(g, 'p1')).toEqual([WITH_TRIGGER]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(hand(g, 'p2')).toEqual([WITH_TRIGGER]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([NO_TRIGGER]);
  });

  it('only a card with a [Trigger] can be trashed as the cost', () => {
    const g = start([WITH_TRIGGER, BLUE], [WITH_TRIGGER]);
    play(g, ID);
    accept(g);
    const cands = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(cands).toEqual([g.find('p1', 'hand', WITH_TRIGGER)]);
  });

  it('a Character without a [Trigger] cannot be returned: the cost is paid and nothing returns', () => {
    const g = start([WITH_TRIGGER], [NO_TRIGGER]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', WITH_TRIGGER)]);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([NO_TRIGGER]);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('"up to 1": may return nothing', () => {
    const g = start([WITH_TRIGGER], [WITH_TRIGGER]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', WITH_TRIGGER)]);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('declining the cost, or having no card with a [Trigger] in hand, returns nothing', () => {
    const a = start([WITH_TRIGGER], [WITH_TRIGGER]);
    play(a, ID);
    decline(a);
    expect(a.zone('p2', 'characters')).toHaveLength(1);
    expect(hand(a, 'p1')).toEqual([WITH_TRIGGER]);

    const b = start([BLUE], [WITH_TRIGGER]);
    play(b, ID);
    // No legal cost: the effect is not offered or cannot be accepted.
    if (b.legal().some((x) => x.type === 'optional' && x.accept)) decline(b);
    expect(b.zone('p2', 'characters')).toHaveLength(1);
  });
});
