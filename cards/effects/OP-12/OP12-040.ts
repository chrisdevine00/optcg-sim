import type { CardScript } from '../../src/dsl.ts';

/** OP12-040 Kuzan. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_040: CardScript = {
  cardId: 'OP12-040',
  textHash: '00479b794550a4',
  verified: {
    source: 'cards/overrides/OP12-040.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'draw',
      label:
        "When a card is trashed from your hand by your {Navy} card's effect, draw cards equal to the number trashed",
      kind: 'auto',
      when: [
        {
          event: 'trashedFromHand',
          owner: 'you',
          by: 'you',
          sourceFilter: { type: 'Navy' },
          includeCosts: true,
        },
      ],
      effect: [{ do: { draw: { eventCount: true } } }],
    },
  ],
  rulings: [
    'Reading (M6b-Q4, Q31): a trash paid as the cost of a Navy card counts (includeCosts, the owner decision settling the cost half of M6b-Q31; a cost is part of the effect, RD 112); one instruction is one event, so the draw equals the cards that one effect trashed',
  ],
};
