import type { CardScript } from '../../src/dsl.ts';

/** OP15-060 Enel. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_060: CardScript = {
  cardId: 'OP15-060',
  textHash: '0c868be7e08a54',
  verified: {
    source: 'cards/overrides/OP15-060.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'sky',
      label:
        "With 6 or less DON!! on your field, this Character cannot be removed by your opponent's effects and gains +2000 power",
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
      id: 'blocker',
      label:
        "DON!! -1: this Character gains [Blocker] until the end of your opponent's next End Phase. Then trash 1 card from your hand",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'self',
                owner: 'you',
              },
              keyword: 'Blocker',
              duration: 'untilEndOfOpponentsNextTurn',
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
