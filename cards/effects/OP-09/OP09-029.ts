import type { CardScript } from '../../src/dsl.ts';

/** OP09-029 Tony Tony.Chopper. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_029: CardScript = {
  cardId: 'OP09-029',
  textHash: '05d41b2f1c648e',
  verified: {
    source: 'cards/overrides/OP09-029.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'end-turn',
      label: 'Set up to 1 of your {ODYSSEY} Characters with a cost of 4 or less as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          do: {
            setActive: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    type: 'ODYSSEY',
                  },
                  {
                    cost: {
                      lte: 4,
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
};
