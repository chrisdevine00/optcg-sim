import type { CardScript } from '../../src/dsl.ts';

/** OP10-063 Vinsmoke Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_063: CardScript = {
  cardId: 'OP10-063',
  textHash: '16e5bad78a2447',
  verified: {
    source: 'cards/overrides/OP10-063.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader\'s type includes "GERMA", look at 5; reveal up to 1 card with a type including "GERMA" and add it to your hand; rest to the bottom',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              typeIncludes: 'GERMA',
            },
          },
          then: [
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
                        typeIncludes: 'GERMA',
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
    },
  ],
  rulings: [
    'reading: "a type including GERMA" is a substring of a type element, so {Kingdom of GERMA} qualifies; the searched card may be of any category; the rest goes to the bottom inside the Leader guard (M4b-5)',
  ],
};
