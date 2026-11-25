import type { CardScript } from '../../src/dsl.ts';

/** OP10-016 Monet. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_016: CardScript = {
  cardId: 'OP10-016',
  textHash: '1fcaba067ae37c',
  verified: {
    source: 'cards/overrides/OP10-016.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'give-don',
      label:
        "You may rest this Character: give up to 2 rested DON!! to your Leader or 1 of your Characters; give up to 1 of your opponent's Characters -1000 power",
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
              n: 2,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then" is not "If you do": the -1000 is given whether or not any DON!! was given (none rested, or declined)',
    '"up to 2" asks a count when 2 or more DON!! are rested (as EB03-014)',
  ],
};
