import type { CardScript } from '../../src/dsl.ts';

/** OP14-050 Chew. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_050: CardScript = {
  cardId: 'OP14-050',
  textHash: '06cf758975928b',
  verified: {
    source: 'cards/overrides/OP14-050.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If your Leader has the {Fish-Man} type, draw 1 card',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Fish-Man',
            },
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
          ],
        },
      ],
    },
  ],
};
