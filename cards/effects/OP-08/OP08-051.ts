import type { CardScript } from '../../src/dsl.ts';

/** OP08-051 Buckin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP08_051: CardScript = {
  cardId: 'OP08-051',
  textHash: '1365133a98b10f',
  verified: {
    source: 'cards/overrides/OP08-051.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Up to 1 of your [Edward Weevil] cards gains +2000 power',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [
        {
          yourTurn: true,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  name: 'Edward Weevil',
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
