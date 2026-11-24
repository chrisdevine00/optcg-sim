import type { CardScript } from '../../src/dsl.ts';

/** OP15-047 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_047: CardScript = {
  cardId: 'OP15-047',
  textHash: '133dc6ba32e2e3',
  verified: {
    source: 'cards/overrides/OP15-047.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'Up to 1 of your Characters gains [Unblockable] during this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'characters',
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              keyword: 'Unblockable',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
