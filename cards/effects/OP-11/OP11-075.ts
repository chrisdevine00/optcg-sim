import type { CardScript } from '../../src/dsl.ts';

/** OP11-075 Jaguar.D.Saul. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_075: CardScript = {
  cardId: 'OP11-075',
  textHash: '03205eabbea8fe',
  verified: {
    source: 'cards/overrides/OP11-075.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label: 'If your Leader is [Nico Robin] and you have 7 or more DON!!, draw 2 cards',
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  name: 'Nico Robin',
                },
              },
              {
                cmp: [
                  {
                    donOnField: 'you',
                  },
                  '>=',
                  7,
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
    {
      id: 'trigger',
      label: "Activate this card's [On Play] effect",
      kind: 'trigger',
      effect: [
        {
          do: {
            activate: {
              ability: 'onPlay',
              of: 'self',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: DON!! cards on your field = cost area plus given DON!! (rules-digest); the On Play conditions are re-checked when [Trigger] activates it',
  ],
};
