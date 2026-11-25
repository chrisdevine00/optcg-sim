import type { CardScript } from '../../src/dsl.ts';

/** OP10-019 Divine Departure. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_019: CardScript = {
  cardId: 'OP10-019',
  textHash: '1678c9cd54e71e',
  verified: {
    source: 'cards/overrides/OP10-019.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may rest 5 of your DON!! cards: K.O. up to 1 of your opponent's Characters with 8000 power or less",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          restDon: 5,
        },
      ],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                power: {
                  lte: 8000,
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
      label: 'Up to 1 of your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
                pick: {
                  upTo: 1,
                },
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
    'reading: the K.O. reads current power (8000 or less), as every "power" filter; the DON!! cost needs 5 active cost-area DON!! and may be declined (the Event is then played and nothing happens)',
  ],
};
