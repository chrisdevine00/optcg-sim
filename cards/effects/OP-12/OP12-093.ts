import type { CardScript } from '../../src/dsl.ts';

/** OP12-093 Morley. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_093: CardScript = {
  cardId: 'OP12-093',
  textHash: '1f1fd25c25ce4e',
  verified: {
    source: 'cards/overrides/OP12-093.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cost-bonus',
      label: 'With a Revolutionary Army Leader, this Character gains +4 cost',
      kind: 'permanent',
      conditions: [
        {
          leader: {
            type: 'Revolutionary Army',
          },
        },
      ],
      apply: [
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 4,
          },
        },
      ],
    },
  ],
};
