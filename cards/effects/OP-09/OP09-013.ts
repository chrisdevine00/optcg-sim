import type { CardScript } from '../../src/dsl.ts';

/** OP09-013 Yasopp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_013: CardScript = {
  cardId: 'OP09-013',
  textHash: '04b8cc765ae6d5',
  verified: {
    source: 'cards/overrides/OP09-013.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Up to 1 of your Leader gains +1000 power until the end of your opponent's next turn",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 1000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label: "[DON!! x1] Give up to 1 of your opponent's Characters -1000 power during this turn",
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          donGiven: 1,
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
