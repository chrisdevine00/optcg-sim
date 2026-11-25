import type { CardScript } from '../../src/dsl.ts';

/** OP13-105 Kouzuki Momonosuke. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_105: CardScript = {
  cardId: 'OP13-105',
  textHash: '1e04e7ee799ee6',
  verified: {
    source: 'cards/overrides/OP13-105.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at all of your Life cards and place them back in your Life area in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtLife: {
              owner: 'you',
              n: 'all',
              place: 'anyOrder',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (G64, M6b-Q81): the cards never leave the Life area (no Life card is "removed"), keep the face state they had, and only you see them; with no Life cards nothing happens',
  ],
};
