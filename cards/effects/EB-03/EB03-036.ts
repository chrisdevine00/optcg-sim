import type { CardScript } from '../../src/dsl.ts';

/** EB03-036 Baby 5. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_036: CardScript = {
  cardId: 'EB03-036',
  textHash: '0e672fcd3a4309',
  verified: {
    source: 'cards/overrides/EB03-036.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "DON!! -1: K.O. up to 2 of your opponent's Characters with a base cost of 3 or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ donMinus: 1 }],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { baseCost: { lte: 3 } },
              pick: { upTo: 2 },
            },
          },
        },
      ],
    },
  ],
};
