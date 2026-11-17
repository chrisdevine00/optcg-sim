import type { CardScript } from '../../src/dsl.ts';

/** OP17-094 Rodo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_094: CardScript = {
  cardId: 'OP17-094',
  textHash: '1757b70eb8aa04',
  verified: {
    source: 'cards/overrides/OP17-094.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'tall',
      label: 'With an {Elbaph} Leader, this Character gains +12 cost',
      kind: 'permanent',
      conditions: [
        {
          leader: {
            type: 'Elbaph',
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
            amount: 12,
          },
        },
      ],
    },
  ],
};
