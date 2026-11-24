import type { CardScript } from '../../src/dsl.ts';

/** ST35-001 Hack. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST35_001: CardScript = {
  cardId: 'ST35-001',
  textHash: '1768c30f9596a2',
  verified: {
    source: 'cards/overrides/ST35-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: "K.O. up to 1 of your opponent's Characters with 2000 base power or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { basePower: { lte: 2000 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
