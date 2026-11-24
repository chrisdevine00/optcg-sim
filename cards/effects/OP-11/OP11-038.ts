import type { CardScript } from '../../src/dsl.ts';

/** OP11-038 Gum-Gum Elephant Gatling. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_038: CardScript = {
  cardId: 'OP11-038',
  textHash: '0f156921f5eeae',
  verified: {
    source: 'cards/overrides/OP11-038.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: "You may rest 1 DON!!: rest up to 1 of your opponent's Characters with cost 5 or less",
      kind: 'activate',
      when: 'main',
      cost: [
        {
          restDon: 1,
        },
      ],
      costOptional: true,
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 5,
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
};
