import type { CardScript } from '../../src/dsl.ts';

/** ST21-004 Jewelry Bonney. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST21_004: CardScript = {
  cardId: 'ST21-004',
  textHash: '0dc4c649d97688',
  verified: {
    source: 'cards/overrides/ST21-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: '[DON!! x2] [On K.O.] Draw 1 card',
      kind: 'auto',
      when: ['onKO'],
      conditions: [{ donGiven: 2 }],
      effect: [{ do: { draw: 1 } }],
    },
  ],
  rulings: [
    "reading (M6b-Q53): [DON!! x2] on an [On K.O.] reads the DON!! given to the Character as it was K.O.'d (last-known), since the DON!! return to the cost area with the K.O.",
  ],
};
