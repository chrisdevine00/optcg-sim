import type { CardScript } from '../../src/dsl.ts';

/** OP18-005 Kung Fu Jugon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_005: CardScript = {
  cardId: 'OP18-005',
  textHash: '11818dbde7ab55',
  verified: {
    source: 'cards/overrides/OP18-005.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'jugon',
      label: '[Your Turn] +1000 power for every [Kung Fu Jugon] you have',
      kind: 'permanent',
      conditions: [
        {
          yourTurn: true,
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: {
              mul: [
                {
                  count: {
                    from: 'characters',
                    owner: 'you',
                    filter: {
                      name: 'Kung Fu Jugon',
                    },
                  },
                },
                1000,
              ],
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Q1 proposed reading (m6b-audit OP-18): [Kung Fu Jugon] are counted among your own Characters, this one included (a lone Jugon is +1000)',
  ],
};
