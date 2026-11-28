import type { CardScript } from '../../src/dsl.ts';

/** OP18-081 Oars. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_081: CardScript = {
  cardId: 'OP18-081',
  textHash: '18e73d2ea12781',
  verified: {
    source: 'cards/overrides/OP18-081.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'moria',
      label:
        'If you have a [Gecko Moria] Character, this Character gains [Double Attack] and [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'you',
            filter: {
              name: 'Gecko Moria',
            },
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
            keyword: 'Double Attack',
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
      id: 'trigger',
      label:
        'Play up to 1 {Thriller Bark Pirates} type Character card with a cost of 4 or less from your trash rested',
      kind: 'trigger',
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
                      type: 'Thriller Bark Pirates',
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
              rested: true,
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "a [Gecko Moria] Character" is a Character on your field with that exact name (a Leader named Gecko Moria does not count)',
  ],
};
