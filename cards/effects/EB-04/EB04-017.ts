import type { CardScript } from '../../src/dsl.ts';

/** EB04-017 Mystoms. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_017: CardScript = {
  cardId: 'EB04-017',
  textHash: '1e8bf12807c045',
  verified: {
    source: 'cards/overrides/EB04-017.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'minks-discount',
      label:
        "[Your Turn] If you have 3 or more {Minks} Characters, all of your opponent's Characters get -1 cost",
      kind: 'permanent',
      conditions: [
        {
          yourTurn: true,
        },
        {
          cmp: [
            {
              count: {
                from: 'characters',
                owner: 'you',
                filter: {
                  type: 'Minks',
                },
              },
            },
            '>=',
            3,
          ],
        },
      ],
      apply: [
        {
          cost: {
            target: {
              from: 'characters',
              owner: 'opponent',
            },
            amount: -1,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'If your Leader has {Minks}, play up to 1 {Minks} Character with cost 5 or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Minks',
            },
          },
          then: [
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
                          type: 'Minks',
                        },
                        {
                          cost: {
                            lte: 5,
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
    },
  ],
  rulings: [
    'reading: the -1 cost is continuous on your turn while you have 3 or more {Minks} Characters (this Character counts) and covers Characters that arrive later; a cost cannot go below 0',
  ],
};
