import type { CardScript } from '../../src/dsl.ts';

/** OP12-006 Shakuyaku. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_006: CardScript = {
  cardId: 'OP12-006',
  textHash: '1f1c418c788c66',
  verified: {
    source: 'cards/overrides/OP12-006.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 5; add up to 1 matching card to your hand',
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
  ],
  rulings: [
    'Read: "1 [Monkey.D.Luffy] or 1 red Event" is one card of either kind (a single take of up to 1)',
    'CR 8-4-4-2: a search may take nothing even with a match in the 5 cards',
  ],
};
