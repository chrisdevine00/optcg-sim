import type { CardScript } from '../../src/dsl.ts';

/** OP15-118 Enel. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_118: CardScript = {
  cardId: 'OP15-118',
  textHash: '065afe6a5a85c6',
  verified: {
    source: 'cards/overrides/OP15-118.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'protected',
      label:
        'With 6 or less DON!! on your field: cannot be removed by opponent effects and gains +2000 power',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              donOnField: 'you',
            },
            '<=',
            6,
          ],
        },
      ],
      apply: [
        {
          restrict: {
            target: {
              from: 'self',
              owner: 'you',
            },
            what: 'cannotBeRemovedByOpponentEffects',
          },
        },
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 2000,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'DON!! -1: look at 5, add up to 1 to hand, rest to the bottom in any order, trash 1 from hand',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'you',
              pick: {
                exactly: 1,
              },
            },
          },
        },
      ],
    },
  ],
};
