import type { CardScript } from '../../src/dsl.ts';

/** OP12-014 Boa Hancock. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_014: CardScript = {
  cardId: 'OP12-014',
  textHash: '1be21b7d7e06c5',
  verified: {
    source: 'cards/overrides/OP12-014.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 5; add up to 1 [Monkey.D.Luffy] or red Event to your hand',
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
                    any: [
                      {
                        name: 'Monkey.D.Luffy',
                      },
                      {
                        all: [
                          {
                            color: 'Red',
                          },
                          {
                            category: ['Event'],
                          },
                        ],
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
      id: 'activate',
      label: 'Trash this Character: give up to 2 rested DON!! to your Leader or 1 Character',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Read: "1 [Monkey.D.Luffy] or red Event" is one card of either kind (a single take of up to 1)',
    'Read: the DON!! may go to the Leader or any Character; this Character is already trashed by the cost',
  ],
};
