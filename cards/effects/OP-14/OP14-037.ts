import type { CardScript } from '../../src/dsl.ts';

/** OP14-037 For Fun. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_037: CardScript = {
  cardId: 'OP14-037',
  textHash: '007038961ab9c8',
  verified: {
    source: 'cards/overrides/OP14-037.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may rest 3 of your cards: K.O. up to 1 of your opponent's rested Characters with 7000 base power or less",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          rest: {
            from: ['leader', 'characters', 'stage', 'donCostArea'],
            owner: 'you',
            pick: {
              exactly: 3,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                all: [
                  {
                    state: 'rested',
                  },
                  {
                    basePower: {
                      lte: 7000,
                    },
                  },
                ],
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
