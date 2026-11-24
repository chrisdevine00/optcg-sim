import type { CardScript } from '../../src/dsl.ts';

/** EB05-009 Fight and Die with Me!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_009: CardScript = {
  cardId: 'EB05-009',
  textHash: '006debe6091147',
  verified: {
    source: 'cards/overrides/EB05-009.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "All of your Characters with 4000 base power or less gain +1000 power until the end of your opponent's next End Phase",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  basePower: {
                    lte: 4000,
                  },
                },
              },
              amount: 1000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label: 'Your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the Characters are those on the field when the [Main] resolves; a Character played later does not gain the power',
  ],
};
