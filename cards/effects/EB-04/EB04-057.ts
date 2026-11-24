import type { CardScript } from '../../src/dsl.ts';

/** EB04-057 Vegapunk. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_057: CardScript = {
  cardId: 'EB04-057',
  textHash: '06213afc40ca9e',
  verified: {
    source: 'cards/overrides/EB04-057.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'protect',
      label:
        'With 2 or less Life, your yellow {Scientist} Characters cannot be removed by opposing effects',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              life: 'you',
            },
            '<=',
            2,
          ],
        },
      ],
      apply: [
        {
          restrict: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    color: 'Yellow',
                  },
                  {
                    type: 'Scientist',
                  },
                ],
              },
            },
            what: 'cannotBeRemovedByOpponentEffects',
          },
        },
      ],
    },
    {
      id: 'blocker',
      label: '[DON!! x1] gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          donGiven: 1,
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
      ],
    },
  ],
};
