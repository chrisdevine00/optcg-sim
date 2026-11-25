import type { CardScript } from '../../src/dsl.ts';

/** OP09-041 Soul Franky Swing Arm Boxing Solid. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_041: CardScript = {
  cardId: 'OP09-041',
  textHash: '13df7cd704de1c',
  verified: {
    source: 'cards/overrides/OP09-041.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        '[Counter] Up to 1 of your Leader or Character cards gains +2000 power this battle; then, with an ODYSSEY Leader and 2 or more rested Characters, set up to 2 of your Characters as active',
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
              amount: 2000,
              duration: 'battle',
            },
          },
        },
        {
          if: {
            all: [
              {
                leader: {
                  type: 'ODYSSEY',
                },
              },
              {
                cmp: [
                  {
                    count: {
                      from: 'characters',
                      owner: 'you',
                      filter: {
                        state: 'rested',
                      },
                    },
                  },
                  '>=',
                  2,
                ],
              },
            ],
          },
          then: [
            {
              do: {
                setActive: {
                  from: 'characters',
                  owner: 'you',
                  pick: {
                    upTo: 2,
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
      label: "Rest up to 1 of your opponent's Characters with a cost of 4 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 4,
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
  rulings: [
    'reading: "Then, if ..." is not "If you do": the second sentence resolves even when no card was given the +2000; the rested-Character count is read after the power step, so it cannot change it',
    'reading: "set up to 2 of your Characters as active" offers any of your Characters (an active one is a legal but pointless choice), as the text does not say "rested"',
  ],
};
