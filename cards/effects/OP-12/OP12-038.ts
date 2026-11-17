import type { CardScript } from '../../src/dsl.ts';

/** OP12-038 Two-Sword Style Rashomon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_038: CardScript = {
  cardId: 'OP12-038',
  textHash: '17860c23a1326d',
  verified: {
    source: 'cards/overrides/OP12-038.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may rest 2 DON!!: K.O. up to 2 of your opponent's rested Characters with a base cost of 4 or less",
      kind: 'activate',
      when: 'main',
      cost: [
        {
          restDon: 2,
        },
      ],
      costOptional: true,
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
                    baseCost: {
                      lte: 4,
                    },
                  },
                ],
              },
              pick: {
                upTo: 2,
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
  rulings: [
    'DECISIONS 2026-11-09 B-1: an Event worded "You may <cost>:" asks the cost after the card is played and it may be declined',
  ],
};
