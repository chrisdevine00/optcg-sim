/** OP10-027 Kin'emon. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { dec, game, hand, none, PLAIN_BLUE, PLAIN_PURPLE, pick, trash, V } from './helpers.ts';
import {
  activate,
  atMain,
  ids,
  KIN_1000,
  KIN_4,
  KIN_6,
  offeredAb,
  offeredPicks,
  POWER_1000,
} from './helpers-w6c2.ts';

const ID = 'OP10-027';
const AB = 'activate';
const mk = (p1: Partial<PlayerSpec> = {}) =>
  game(
    {
      leader: PLAIN_PURPLE,
      characters: [ID],
      trash: [KIN_1000, V.c1],
      hand: [KIN_6, KIN_4, V.c6],
      ...p1,
    },
    { leader: PLAIN_BLUE },
  );

describe("OP10-027 Kin'emon", () => {
  it("places this Character and a 1000-power [Kin'emon] from the trash at the bottom of the deck, then plays a cost 6 [Kin'emon] from the hand", () => {
    const g = mk();
    const deckBefore = g.zone('p1', 'deck').length;
    activate(g, g.find('p1', 'characters', ID), AB);
    // The trash card is the only [Kin'emon] with 1000 power: the cost asks nothing, the play asks.
    expect(offeredPicks(g)).toEqual([g.find('p1', 'hand', KIN_6)]);
    pick(g, [g.find('p1', 'hand', KIN_6)]);
    expect(atMain(g)).toBe(true);
    expect(ids(g, 'p1', 'characters')).toEqual([KIN_6]);
    const deck = ids(g, 'p1', 'deck');
    expect(deck).toHaveLength(deckBefore + 2);
    // M6b-Q73: in the order paid, this Character then the trash card.
    expect(deck.slice(-2)).toEqual([ID, KIN_1000]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toEqual([KIN_4, V.c6]);
  });

  it("the cost is the whole ability: not offered without a [Kin'emon] with exactly 1000 power in the trash", () => {
    // A Kin'emon of another power, a 1000-power card that is not a Kin'emon, and an empty trash.
    for (const t of [[KIN_6, KIN_4], [POWER_1000], []]) {
      const g = mk({ trash: t });
      expect(offeredAb(g, g.find('p1', 'characters', ID), AB)).toBe(false);
      expect(g.zone('p1', 'characters')).toHaveLength(1);
    }
    // With the 1000-power [Kin'emon] it is offered.
    const ok = mk({ trash: [KIN_1000] });
    expect(offeredAb(ok, ok.find('p1', 'characters', ID), AB)).toBe(true);
  });

  it('"a cost of 6" is exactly 6: a cost 4 [Kin\'emon] and a cost 6 card with another name are not offered', () => {
    const g = mk({ hand: [KIN_4, V.c6] });
    activate(g, g.find('p1', 'characters', ID), AB);
    // Raw: the cost is paid and the play is asked at max 0 (the hand is hidden): nothing can be picked.
    expect(dec(g)?.kind).toBe('choose');
    expect(offeredPicks(g)).toEqual([]);
    none(g);
    expect(atMain(g)).toBe(true);
    // The cost stays paid.
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it('"up to 1": with two cost 6 [Kin\'emon] in the hand only one is played, and it may be declined', () => {
    const two = mk({ hand: [KIN_6, KIN_6] });
    activate(two, two.find('p1', 'characters', ID), AB);
    pick(two, [two.find('p1', 'hand', KIN_6, 0)]);
    expect(ids(two, 'p1', 'characters')).toEqual([KIN_6]);
    expect(hand(two, 'p1')).toEqual([KIN_6]);

    const declined = mk();
    activate(declined, declined.find('p1', 'characters', ID), AB);
    none(declined);
    expect(ids(declined, 'p1', 'characters')).toEqual([]);
    expect(hand(declined, 'p1')).toContain(KIN_6);
    // The cards were placed anyway.
    expect(ids(declined, 'p1', 'deck').slice(-2)).toEqual([ID, KIN_1000]);
  });

  it('the cost is a removal of this Character: it is not on the field when the hand card is played', () => {
    const g = mk({ characters: [ID, V.c2] });
    activate(g, g.find('p1', 'characters', ID), AB);
    pick(g, [g.find('p1', 'hand', KIN_6)]);
    expect(ids(g, 'p1', 'characters')).toEqual([V.c2, KIN_6]);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });
});
