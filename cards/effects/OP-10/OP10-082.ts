import type { CardScript } from '../../src/dsl.ts';

/** OP10-082 Kuzan. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_082: CardScript = {
  cardId: 'OP10-082',
  textHash: '1e3285ce262c3e',
  verified: {
    source: 'cards/overrides/OP10-082.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'no-remove',
      label: "Cannot be removed from the field by your opponent's effects",
      kind: 'permanent',
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
      ],
    },
    {
      id: 'activate',
      label:
        'Trash this Character: draw 1 card; then play up to 1 Blackbeard Pirates Character with a cost of 5 or less other than [Kuzan] from your trash',
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
            draw: 1,
          },
        },
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
                      type: 'Blackbeard Pirates',
                    },
                    {
                      cost: {
                        lte: 5,
                      },
                    },
                    {
                      not: {
                        name: 'Kuzan',
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
  rulings: [
    'reading: the trashed Kuzan is in the trash when the play is chosen but is excluded by name, as is any other [Kuzan]; the play happens even if the deck is empty and the draw did nothing ("Then" is not "If you do")',
  ],
};
