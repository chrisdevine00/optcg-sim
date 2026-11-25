import type { CardScript } from '../../src/dsl.ts';

/** EB02-026 Nefeltari Vivi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_026: CardScript = {
  cardId: 'EB02-026',
  textHash: '0f9c4ec3ed4d42',
  verified: {
    source: 'cards/overrides/EB02-026.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If your Leader is multicolored and you have 5 or less cards in hand, draw 2',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  multicolor: true,
                },
              },
              {
                cmp: [
                  {
                    hand: 'you',
                  },
                  '<=',
                  5,
                ],
              },
            ],
          },
          then: [
            {
              do: {
                draw: 2,
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the hand size is read when the effect resolves (after this card left the hand)',
  ],
};
