import type { CardScript } from '../../src/dsl.ts';

/** EB05-045 Ms. Monday. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_045: CardScript = {
  cardId: 'EB05-045',
  textHash: '10e91d309d1d4f',
  verified: {
    source: 'cards/overrides/EB05-045.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'K.O. up to 1 of your {Baroque Works} Characters',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'you',
              filter: {
                typeIncludes: 'Baroque Works',
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label:
        'Look at 3; reveal up to 1 {Baroque Works} card and add it to your hand; trash the rest',
      kind: 'auto',
      when: ['onKO'],
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
                    typeIncludes: 'Baroque Works',
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'trash',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading: the [On Play] K.O. may choose this Character itself (it is one of your Baroque Works Characters), as the text says "your Characters"',
  ],
};
