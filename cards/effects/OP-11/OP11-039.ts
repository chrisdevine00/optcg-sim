import type { CardScript } from '../../src/dsl.ts';

/** OP11-039 Vagabond Drill. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_039: CardScript = {
  cardId: 'OP11-039',
  textHash: '06126a199cccd3',
  verified: {
    source: 'cards/overrides/OP11-039.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Your {Fish-Man}/{Merfolk} Leader or Character gains +3000 power during this battle; then rest up to 1 opposing Character with cost 3 or less',
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
                      type: 'Fish-Man',
                    },
                    {
                      type: 'Merfolk',
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 3,
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
    {
      id: 'trigger',
      label: "Rest up to 1 of your opponent's Characters with cost 4 or less",
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
    'reading: "Then, rest ..." is not conditional on the boost target (no "If"): with no {Fish-Man}/{Merfolk} card to choose the opponent Character is still rested',
  ],
};
