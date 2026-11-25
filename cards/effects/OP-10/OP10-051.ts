import type { CardScript } from '../../src/dsl.ts';

/** OP10-051 Hack. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_051: CardScript = {
  cardId: 'OP10-051',
  textHash: '034d6e2f230de6',
  verified: {
    source: 'cards/overrides/OP10-051.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'attack',
      label:
        '[DON!! x1] When attacking: look at 3; reveal up to 1 {Revolutionary Army} Character card and add it to your hand; rest to the bottom',
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          donGiven: 1,
        },
      ],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    all: [
                      {
                        category: ['Character'],
                      },
                      {
                        type: 'Revolutionary Army',
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
};
