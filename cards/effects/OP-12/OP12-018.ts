import type { CardScript } from '../../src/dsl.ts';

/** OP12-018 Color of the Supreme King Haki. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_018: CardScript = {
  cardId: 'OP12-018',
  textHash: '0e7b00f2f1578a',
  verified: {
    source: 'cards/overrides/OP12-018.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'counter',
      label:
        "+2000 power during this battle; you may rest 1 DON!!: -1000 power to your opponent's cards",
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  any: [
                    {
                      category: ['Character'],
                    },
                    {
                      name: 'Silvers Rayleigh',
                    },
                  ],
                },
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
            cmp: [
              {
                donOnField: 'you',
                state: 'active',
              },
              '>=',
              1,
            ],
          },
          then: [
            {
              may: [
                {
                  do: {
                    rest: {
                      from: 'donCostArea',
                      owner: 'you',
                      pick: {
                        exactly: 1,
                      },
                    },
                  },
                },
              ],
              label: 'rested',
              prompt: 'rest 1 of your DON!! cards?',
            },
            {
              ifDid: 'rested',
              then: [
                {
                  do: {
                    power: {
                      target: {
                        from: ['leader', 'characters'],
                        owner: 'opponent',
                      },
                      amount: -1000,
                      duration: 'thisTurn',
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'Read: [Silvers Rayleigh] is matched by name on a Leader or Character; "your Characters" covers any Character',
    'Read: "you may rest 1 of your DON!!" needs an active DON!! card (CR 1-3-2-1); with none the question is not asked and "if you do" is false',
    'Read: "Then" after the "up to 1" boost is not an "if": the rest step is offered even when no card was chosen for the boost',
  ],
};
