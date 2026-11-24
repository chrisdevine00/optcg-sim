import type { CardScript } from '../../src/dsl.ts';

/** OP11-097 After All These Years I'm Losing My Edge!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_097: CardScript = {
  cardId: 'OP11-097',
  textHash: '0cc1d5a3b77340',
  verified: {
    source: 'cards/overrides/OP11-097.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Up to 1 of your Leader or Character cards gains +1000 power during this battle; then if you have 10 or more cards in your trash, add up to 1 black Character with cost 3 or less from your trash to your hand',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 1000,
              duration: 'battle',
            },
          },
        },
        {
          if: {
            cmp: [
              {
                trash: 'you',
              },
              '>=',
              10,
            ],
          },
          then: [
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
                          color: 'Black',
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
                  to: {
                    zone: 'hand',
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
    'reading: the Event is in the trash while it resolves, so it counts toward the 10; a Character it adds can be any black Character with cost 3 or less',
  ],
};
