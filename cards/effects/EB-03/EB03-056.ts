import type { CardScript } from '../../src/dsl.ts';

/** EB03-056 Belo Betty. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_056: CardScript = {
  cardId: 'EB03-056',
  textHash: '00e58876922f0a',
  verified: {
    source: 'cards/overrides/EB03-056.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Turn 1 card from the top of your Life cards face-up: K.O. up to 1 of your opponent's Characters with a base cost of 3 or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ turnLifeFaceUp: 1 }],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { baseCost: { lte: 3 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
