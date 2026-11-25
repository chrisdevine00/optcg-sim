import type { CardScript } from '../../src/dsl.ts';

/** OP09-007 Heat. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_007: CardScript = {
  cardId: 'OP09-007',
  textHash: '14f1b8e98a9c51',
  verified: {
    source: 'cards/overrides/OP09-007.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'Up to 1 of your Leader with 4000 power or less gains +1000 power during this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
                filter: {
                  power: {
                    lte: 4000,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "4000 power or less" is the Leader\'s current power when the effect resolves',
  ],
};
