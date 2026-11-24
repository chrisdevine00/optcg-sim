import type { CardScript } from '../../src/dsl.ts';

/** OP11-086 Coribou. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_086: CardScript = {
  cardId: 'OP11-086',
  textHash: '0963ae63231b94',
  verified: {
    source: 'cards/overrides/OP11-086.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label: 'Trash 1 card from your hand',
      effect: [
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
    {
      id: 'activate',
      label:
        'You may trash this Character: play up to 1 [Caribou] with a cost of 4 or less from your trash',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      name: 'Caribou',
                    },
                    {
                      cost: {
                        lte: 4,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
