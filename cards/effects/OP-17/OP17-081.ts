import type { CardScript } from '../../src/dsl.ts';

/** OP17-081 Gerd. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_081: CardScript = {
  cardId: 'OP17-081',
  textHash: '05546d3e1653d5',
  verified: {
    source: 'cards/overrides/OP17-081.json (card text in cards/data)',
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
    {
      id: 'on-play',
      label:
        'Trash 1 card from your hand: add up to 1 Character with a cost of 8 or less other than [Gerd] from your trash to your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      cost: {
                        lte: 8,
                      },
                    },
                    {
                      not: {
                        name: 'Gerd',
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
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
    },
  ],
};
