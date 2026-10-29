import type { CardScript } from '../../src/dsl.ts';

/** OP07-076 Slow-Slow Beam Sword. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP07_076: CardScript = {
  cardId: 'OP07-076',
  textHash: '00b2b31ebea34a',
  verified: {
    source: 'cards/overrides/OP07-076.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'counter',
      label: "+2000 power during this battle; then rest up to 1 of your opponent's Characters",
      kind: 'activate',
      when: 'counter',
      cost: [
        {
          donMinus: 1,
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
              amount: 2000,
              duration: 'battle',
            },
          },
        },
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
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
      label: 'Add up to 1 active DON!!',
      kind: 'trigger',
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'active',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
  ],
};
