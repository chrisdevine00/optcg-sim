import type { CardScript } from '../../src/dsl.ts';

/** OP14-038 I Never Bother to Remember the Faces of Trash. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_038: CardScript = {
  cardId: 'OP14-038',
  textHash: '18c0336c724d90',
  verified: {
    source: 'cards/overrides/OP14-038.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may rest 2 of your cards: draw 1 card and rest up to 1 of your opponent's Characters with 7000 base power or less",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          rest: {
            from: ['leader', 'characters', 'stage', 'donCostArea'],
            owner: 'you',
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                basePower: {
                  lte: 7000,
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
