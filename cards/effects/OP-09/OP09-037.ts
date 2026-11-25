import type { CardScript } from '../../src/dsl.ts';

/** OP09-037 Lim. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_037: CardScript = {
  cardId: 'OP09-037',
  textHash: '12f44efb98f543',
  verified: {
    source: 'cards/overrides/OP09-037.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 {ODYSSEY} card other than [Lim] and add it to your hand; the rest to the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
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
                        type: 'ODYSSEY',
                      },
                      {
                        not: {
                          name: 'Lim',
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
      id: 'end-turn',
      label: 'If you have 3 or more rested Characters, set this Character as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    state: 'rested',
                  },
                },
              },
              '>=',
              3,
            ],
          },
          then: [
            {
              do: {
                setActive: {
                  from: 'self',
                  owner: 'you',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "ODYSSEY" type card is any category with the exact type {ODYSSEY} (Characters, Events and Stages count); a rested Lim counts herself toward the 3; no colon, so an effect `if`',
  ],
};
