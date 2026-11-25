/** OP10-026 Kin'emon. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, PLAIN_BLUE, PLAIN_PURPLE } from './helpers.ts';
import { activate, asks, game, inert, offeredAb, pickableCards } from './helpers-w6c1.ts';

const ID = 'OP10-026';
const ZERO = 'OP10-027'; // [Kin'emon], 0 power (in the trash its text is inert)
const SIX = 'OP12-025'; // [Kin'emon], cost 6, 8000, no text
const SIX_B = 'OP01-040'; // [Kin'emon], cost 6, has an [On Play] (made inert)
const FOUR = 'ST28-003'; // [Kin'emon], cost 4

describe("OP10-026 Kin'emon", () => {
  const mk = (
    handCards: string[],
    trashCards: string[],
    extra: Parameters<typeof game>[0] = { leader: PLAIN_PURPLE },
  ) => {
    const g = game(
      { ...extra, characters: [ID], hand: handCards, trash: trashCards },
      { leader: PLAIN_BLUE },
    );
    inert(g, SIX_B);
    return g;
  };
  const go = (g: ReturnType<typeof mk>) => activate(g, g.find('p1', 'characters', ID), 'activate');
  const bottom = (g: ReturnType<typeof mk>, n: number) =>
    g
      .zone('p1', 'deck')
      .slice(-n)
      .map((c) => c.card);

  it("places this Character and a 0-power [Kin'emon] from your trash at the bottom of the deck, then plays a cost 6 [Kin'emon] from your hand", () => {
    const g = mk([SIX, FOUR, SIX_B], [ZERO]);
    const deckBefore = g.zone('p1', 'deck').length;
    go(g);
    // The only 0-power [Kin'emon] is taken (a pick is asked only if more than one qualifies).
    if (dec(g)?.kind === 'choose' && pickableCards(g).includes(ZERO))
      pick(g, [g.find('p1', 'trash', ZERO)]);
    expect(g.zone('p1', 'deck')).toHaveLength(deckBefore + 2);
    expect(bottom(g, 2)).toEqual([ID, ZERO]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    // Cost 6 yes (twice), cost 4 no.
    expect(pickableCards(g).sort()).toEqual([SIX, SIX_B].sort());
    pick(g, [g.find('p1', 'hand', SIX)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([SIX]);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
  });

  it("the trash card must be a [Kin'emon] with exactly 0 power: 1000 power (this card) and 8000 power do not do", () => {
    const g = mk([SIX], [ID, SIX]);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
    const h = mk([SIX], [ZERO]);
    expect(offeredAb(h, h.find('p1', 'characters', ID), 'activate')).toBe(true);
  });

  it("with two 0-power [Kin'emon] in the trash, the player chooses which one is placed", () => {
    const g = mk([SIX], [ZERO, ZERO]);
    go(g);
    expect(asks(g)).toBe(true);
    pick(g, [g.find('p1', 'trash', ZERO, 1)]);
    expect(g.zone('p1', 'trash')).toHaveLength(1);
    expect(bottom(g, 2)).toEqual([ID, ZERO]);
  });

  it('"up to 1": may play nothing (both cards are placed all the same); asked even with no cost 6 [Kin\'emon] in hand', () => {
    const g = mk([SIX], [ZERO]);
    go(g);
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([SIX]);
    const h = mk([FOUR], [ZERO]);
    go(h);
    expect(asks(h)).toBe(true);
    expect(pickableCards(h)).toEqual([]);
  });

  it("not offered without a 0-power [Kin'emon] in the trash", () => {
    const g = mk([SIX], []);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it("plays only [Kin'emon] by name, cost exactly 6 (cost 4 is out)", () => {
    const g = mk([SIX, FOUR], [ZERO]);
    go(g);
    expect(pickableCards(g)).toEqual([SIX]);
  });
});
