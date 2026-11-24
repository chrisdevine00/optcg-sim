import type { CardScript } from '../../src/dsl.ts';

/** EB05-024 Little Sadi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_024: CardScript = {
  cardId: 'EB05-024',
  textHash: '1ae0b666f8f91b',
  verified: {
    source: 'cards/overrides/EB05-024.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'impel-down',
      label: 'With an {Impel Down} Leader: gains [Blocker] and +2 cost',
      kind: 'permanent',
      conditions: [
        {
          leader: {
            type: 'Impel Down',
          },
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Blocker',
          },
        },
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 2,
          },
        },
      ],
    },
  ],
};
