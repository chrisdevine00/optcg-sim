import type { CardScript } from '../../src/dsl.ts';

/** OP14-036 Strive to Surpass me, Roronoa Zoro!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_036: CardScript = {
  cardId: 'OP14-036',
  textHash: '1b08671acd74fa',
  verified: {
    source: 'cards/overrides/OP14-036.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'You may rest 1 of your cards: up to 1 of your Leader or Characters gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      costOptional: true,
      cost: [
        {
          rest: {
            from: ['leader', 'characters', 'stage', 'donCostArea'],
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
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
              amount: 4000,
              duration: 'battle',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        "You may rest 1 of your cards: rest up to 1 of your opponent's Characters with 7000 base power or less",
      kind: 'trigger',
      cost: [
        {
          rest: {
            from: ['leader', 'characters', 'stage', 'donCostArea'],
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
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
  ],
};
