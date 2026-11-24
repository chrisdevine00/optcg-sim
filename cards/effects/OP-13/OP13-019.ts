import type { CardScript } from '../../src/dsl.ts';

/** OP13-019 But Ace Here Said You Deserved It!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_019: CardScript = {
  cardId: 'OP13-019',
  textHash: '16e16dac0f769d',
  verified: {
    source: 'cards/overrides/OP13-019.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Rest 4 DON!!: opposing Character -3000, then K.O. up to 1 opposing Character with 3000 power or less',
      kind: 'activate',
      when: 'main',
      cost: [
        {
          restDon: 4,
        },
      ],
      costOptional: true,
      effect: [
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
              amount: -3000,
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              pick: {
                upTo: 1,
              },
              filter: {
                power: {
                  lte: 3000,
                },
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
