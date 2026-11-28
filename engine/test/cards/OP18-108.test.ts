/** OP18-108 Funkfreed. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, game, hand, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { activate, canPick, offeredAb } from './helpers-w3s.ts';
import { CP_CHAR, CP_L, SPANDAM } from './helpers-op18-g4.ts';

const ID = 'OP18-108';
const onPlay = (handCards: string[], deck = [V.c1, V.c2, V.c3]) => {
  const g = game(
    { leader: CP_L, hand: [ID, ...handCards], deck, costArea: { active: 1, rested: 0 } },
    { leader: PLAIN_BLUE },
  );
  play(g, ID);
  return g;
};

describe('OP18-108 Funkfreed', () => {
  it('[On Play] trash a card with a type including "CP" from your hand: draw 2', () => {
    const g = onPlay([CP_CHAR, BLUE]);
    accept(g);
    expect(canPick(g, g.find('p1', 'hand', CP_CHAR))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', BLUE))).toBe(false);
    pick(g, [g.find('p1', 'hand', CP_CHAR)]);
    expect(hand(g, 'p1').sort()).toEqual([BLUE, V.c1, V.c2].sort());
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([CP_CHAR]);
  });

  it('"you may": declining trashes nothing and draws nothing', () => {
    const g = onPlay([CP_CHAR]);
    decline(g);
    expect(hand(g, 'p1')).toEqual([CP_CHAR]);
  });

  it('not offered without a CP card in hand (a non-CP card does not pay)', () => {
    const g = onPlay([BLUE]);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('[Activate: Main] rest this Character: your [Spandam] gains +1000 this turn', () => {
    const g = game({ leader: CP_L, characters: [ID, SPANDAM, V.c1] }, { leader: PLAIN_BLUE });
    const funk = g.find('p1', 'characters', ID);
    const before = g.power(g.find('p1', 'characters', SPANDAM));
    expect(offeredAb(g, funk, 'boost')).toBe(true);
    activate(g, funk, 'boost');
    expect(canPick(g, g.find('p1', 'characters', SPANDAM))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'characters', SPANDAM)]);
    expect(g.power(g.find('p1', 'characters', SPANDAM))).toBe(before! + 1000);
    expect(g.card(funk).rested).toBe(true);
  });

  it('a rested Funkfreed cannot use it', () => {
    const g = game(
      { leader: CP_L, characters: [{ card: ID, rested: true }, SPANDAM] },
      { leader: PLAIN_BLUE },
    );
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'boost')).toBe(false);
  });
});
