import type { CardScript } from '../../src/dsl.ts';

/** EB03-015. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_015: CardScript = {
  cardId: 'EB03-015',
  textHash: '0393dcd20423cb',
  verified: {
    source: 'cards/overrides/EB03-015.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'give-rest',
      label:
        "You may rest this Character: give up to 1 rested DON!! to 1 of your {Fish-Man} or {Merfolk} Leader or Characters; then rest up to 1 of your opponent's Characters with a cost of 2 or less",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
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
                  exactly: 1,
                },
              },
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
                  lte: 2,
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
    'reading: "Then" is not "If you do": the rest happens even if no DON!! was given (no rested DON!! or no {Fish-Man}/{Merfolk} target). With one rested DON!! the "up to 1" give is not asked (as OP14-005)',
  ],
};
