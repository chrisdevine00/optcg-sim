import type { CardScript } from '../../src/dsl.ts';

/** OP14-100 Absalom. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_100: CardScript = {
  cardId: 'OP14-100',
  textHash: '19c7df469e0c0a',
  verified: {
    source: 'cards/overrides/OP14-100.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        'Look at 3, reveal up to 1 {Thriller Bark Pirates} card to hand, place the rest at the bottom in any order',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [
                {
                  pick: { upTo: 1 },
                  filter: { type: 'Thriller Bark Pirates' },
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
      label:
        'Play up to 1 {Thriller Bark Pirates} Character with a cost of 4 or less from your trash rested',
      kind: 'trigger',
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { type: 'Thriller Bark Pirates' },
                    { cost: { lte: 4 } },
                  ],
                },
                pick: { upTo: 1 },
              },
              rested: true,
            },
          },
        },
      ],
    },
  ],
};
