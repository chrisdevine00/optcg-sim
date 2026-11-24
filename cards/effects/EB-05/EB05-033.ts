import type { CardScript } from '../../src/dsl.ts';

/** EB05-033 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_033: CardScript = {
  cardId: 'EB05-033',
  textHash: '11ec7a750b35cf',
  verified: {
    source: 'cards/overrides/EB05-033.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'With a {Straw Hat Crew} Leader and 6+ fewer DON!! than your opponent: draw 3, trash 2, add up to 4 rested DON!!',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  type: 'Straw Hat Crew',
                },
              },
              {
                cmp: [
                  {
                    donOnField: 'you',
                  },
                  '<=',
                  {
                    sum: [
                      {
                        donOnField: 'opponent',
                      },
                      -6,
                    ],
                  },
                ],
              },
            ],
          },
          then: [
            {
              do: {
                draw: 3,
              },
            },
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'you',
                  pick: {
                    exactly: 2,
                  },
                },
              },
            },
            {
              do: {
                addDon: [
                  {
                    n: 4,
                    state: 'rested',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: ['M6b audit Q10: "Then, add up to 4 DON!!" is inside the "if" (gated by the condition)'],
};
