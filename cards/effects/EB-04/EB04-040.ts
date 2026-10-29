import type { CardScript } from '../../src/dsl.ts';

/** EB04-040 Flame Dragon Torch. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_040: CardScript = {
  cardId: 'EB04-040',
  textHash: '01751e564b90e0',
  verified: {
    source: 'cards/overrides/EB04-040.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'main',
      label: "Up to 1 of your [Kaido] gains +3000; then rest up to 1 of your opponent's Characters",
      kind: 'activate',
      when: 'main',
      cost: [
        {
          restDon: 6,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  name: 'Kaido',
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 3000,
              duration: 'thisTurn',
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
      id: 'counter',
      label: 'Your Leader gains +4000 power during this battle',
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
                from: 'leader',
                owner: 'you',
              },
              amount: 4000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: ['QA-OP14 EB04-040: the [Main] works with no [Kaido] on the field'],
};
