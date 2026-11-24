import type { CardScript } from '../../src/dsl.ts';

/** OP13-094 York. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_094: CardScript = {
  cardId: 'OP13-094',
  textHash: '1bf9488f4d52a9',
  verified: {
    source: 'cards/overrides/OP13-094.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Up to 1 of your {Celestial Dragons} Characters gains +2000 power this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  type: 'Celestial Dragons',
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
