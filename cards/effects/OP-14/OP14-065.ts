import type { CardScript } from '../../src/dsl.ts';

/** OP14-065 Senor Pink. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_065: CardScript = {
  cardId: 'OP14-065',
  textHash: '1ca5244bfca397',
  verified: {
    source: 'cards/overrides/OP14-065.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: 'Your opponent returns 1 DON!! from their field to their DON!! deck',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            returnDon: {
              n: 1,
              player: 'opponent',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b-Q45 family): the opponent chooses which DON!! (active, rested or given) and returns one if they have any',
  ],
};
