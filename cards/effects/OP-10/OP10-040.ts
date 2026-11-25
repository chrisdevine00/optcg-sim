import type { CardScript } from '../../src/dsl.ts';

/** OP10-040 The Weak Do Not Have the Right to Choose How They Die. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_040: CardScript = {
  cardId: 'OP10-040',
  textHash: '09b94b52d8146c',
  verified: {
    source: 'cards/overrides/OP10-040.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: "K.O. up to 1 of your opponent's rested Characters with a cost of 7 or less",
      kind: 'activate',
      when: ['main', 'counter'],
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
                    cost: {
                      lte: 7,
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
  ],
  rulings: [
    'reading: as a [Counter] it K.O.s a rested Character (an active attacker is not eligible)',
  ],
};
