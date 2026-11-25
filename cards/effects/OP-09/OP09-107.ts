import type { CardScript } from '../../src/dsl.ts';

/** OP09-107 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_107: CardScript = {
  cardId: 'OP09-107',
  textHash: '069bbc547a0a19',
  verified: {
    source: 'cards/overrides/OP09-107.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label:
        "If your opponent has 3 or more Life cards, trash up to 1 card from the top of your opponent's Life cards",
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'opponent',
              },
              '>=',
              3,
            ],
          },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'lifeTop',
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                  },
                  to: {
                    zone: 'trash',
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      kind: 'trigger',
      label: 'Play up to 1 yellow Character card with a cost of 3 or less from your hand',
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      color: 'Yellow',
                    },
                    {
                      cost: {
                        lte: 3,
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
    'reading: the Life card is trashed, not damage: no [Trigger] (wave 4 G30); the Life count is public (3 is the boundary)',
  ],
};
