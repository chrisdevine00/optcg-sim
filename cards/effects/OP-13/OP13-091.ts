import type { CardScript } from '../../src/dsl.ts';

/** OP13-091 St. Marcus Mars. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_091: CardScript = {
  cardId: 'OP13-091',
  textHash: '07a49c0849d36b',
  verified: {
    source: 'cards/overrides/OP13-091.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'protect',
      label: 'With 7+ cards in trash: cannot be removed by opponent effects and gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              trash: 'you',
            },
            '>=',
            7,
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
    {
      id: 'on-play',
      label: "Trash 1 from hand: K.O. up to 1 of opponent's Characters with base cost 5 or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                baseCost: {
                  lte: 5,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
};
