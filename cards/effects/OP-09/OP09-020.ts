import type { CardScript } from '../../src/dsl.ts';

/** OP09-020 Come On!! We'll Fight You!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_020: CardScript = {
  cardId: 'OP09-020',
  textHash: '0c86a46f4a0773',
  verified: {
    source: 'cards/overrides/OP09-020.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "[Main] Look at 5; reveal up to 1 Red-Haired Pirates card other than [Come On!! We'll Fight You!!] and add it to your hand; rest to the bottom",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    all: [
                      {
                        type: 'Red-Haired Pirates',
                      },
                      {
                        not: {
                          name: "Come On!! We'll Fight You!!",
                        },
                      },
                    ],
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 1 card',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "\\"Red-Haired Pirates\\" type card" is any category (Character, Event, Stage) with that type element',
  ],
};
