import type { CardScript } from '../../src/dsl.ts';

/** OP16-007 Jozu. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_007: CardScript = {
  cardId: 'OP16-007',
  textHash: '10d87c8f1387f8',
  verified: {
    source: 'cards/overrides/OP16-007.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        "You may reveal 1 Character card with 8000 power from your hand: up to 1 of your opponent's Characters gets -1000 power",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              all: [
                {
                  category: ['Character'],
                },
                {
                  power: {
                    eq: 8000,
                  },
                },
              ],
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
