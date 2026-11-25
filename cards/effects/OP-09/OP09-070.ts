import type { CardScript } from '../../src/dsl.ts';

/** OP09-070 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_070: CardScript = {
  cardId: 'OP09-070',
  textHash: '1df74ba3de2411',
  verified: {
    source: 'cards/overrides/OP09-070.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may return 1 or more DON!! cards from your field to your DON!! deck: give up to 2 rested DON!! cards to your Leader or 1 of your Characters',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ returnDon: { atLeast: 1 } }],
      effect: [
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              to: { from: ['leader', 'characters'], owner: 'you', pick: { exactly: 1 } },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "up to 2" asks a count when 2 or more DON!! are rested; the cost return happens first, so a rested DON!! the cost returned cannot be given (as OP10-016)',
  ],
};
