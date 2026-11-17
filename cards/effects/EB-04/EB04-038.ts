import type { CardScript } from '../../src/dsl.ts';

/** EB04-038 Rosinante & Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_038: CardScript = {
  cardId: 'EB04-038',
  textHash: '01326b876d0e0c',
  verified: {
    source: 'cards/overrides/EB04-038.json (card text in cards/data)',
    date: '2026-10-28',
  },
  keywords: ['Blocker'],
  rules: [
    {
      alsoNamed: ['Trafalgar Law', 'Donquixote Rosinante'],
    },
  ],
  abilities: [
    {
      id: 'on-play',
      label:
        'If you have as few DON!! as your opponent or fewer, draw 1, then add up to 1 DON!! as active',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'you',
              },
              '<=',
              {
                donOnField: 'opponent',
              },
            ],
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
            {
              do: {
                addDon: [
                  {
                    n: 1,
                    state: 'active',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'Reading: "Then, add up to 1 DON!! card" is gated by the DON!! condition (CR 4-10-1)',
    'DON!! on the field counts the cost area plus given DON!! (rules digest)',
  ],
};
