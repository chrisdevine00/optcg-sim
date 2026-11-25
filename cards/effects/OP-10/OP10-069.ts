import type { CardScript } from '../../src/dsl.ts';

/** OP10-069 Fighting Fish. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_069: CardScript = {
  cardId: 'OP10-069',
  textHash: '11082eb9938cf2',
  verified: {
    source: 'cards/overrides/OP10-069.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'attack',
      label:
        "[DON!! x1] When attacking, DON!! -1: K.O. up to 1 of your opponent's Characters with a cost of 1 or less",
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          donGiven: 1,
        },
      ],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 1,
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
