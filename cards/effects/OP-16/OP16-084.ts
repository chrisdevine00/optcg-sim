import type { CardScript } from '../../src/dsl.ts';

/** OP16-084 Kouzuki Momonosuke. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_084: CardScript = {
  cardId: 'OP16-084',
  textHash: '02dc58578041dd',
  verified: {
    source: 'cards/overrides/OP16-084.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'recur',
      label:
        'Trash this Character with a cost of 20 or more: with 9+ DON!!, play up to 1 [Kouzuki Momonosuke] with a cost of 9 from your trash',
      kind: 'activate',
      when: 'activateMain',
      conditions: [
        {
          self: {
            cost: {
              gte: 20,
            },
          },
        },
      ],
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'you',
              },
              '>=',
              9,
            ],
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'trash',
                    owner: 'you',
                    filter: {
                      all: [
                        {
                          name: 'Kouzuki Momonosuke',
                        },
                        {
                          cost: {
                            eq: 9,
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
};
