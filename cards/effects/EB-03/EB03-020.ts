import type { CardScript } from '../../src/dsl.ts';

/** EB03-020. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_020: CardScript = {
  cardId: 'EB03-020',
  textHash: '0c4b0c4ac4c867',
  verified: {
    source: 'cards/overrides/EB03-020.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Up to 1 of your Leader or Character cards gains +2000 power during this battle; then, with 2 or more {FILM} Characters, that card gains an additional +2000',
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
                bind: 'buffed',
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
                count: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    type: 'FILM',
                  },
                },
              },
              '>=',
              2,
            ],
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: ['leader', 'characters'],
                    owner: 'you',
                    filter: {
                      ref: 'buffed',
                    },
                  },
                  amount: 2000,
                  duration: 'battle',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Set up to 1 of your Characters as active',
      kind: 'trigger',
      effect: [
        {
          do: {
            setActive: {
              from: 'characters',
              owner: 'you',
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
    'reading: the {FILM} count is read after the first +2000 resolves (it does not change the Character count); "that card" is the card chosen for the first boost, so no card chosen means no second boost',
  ],
};
