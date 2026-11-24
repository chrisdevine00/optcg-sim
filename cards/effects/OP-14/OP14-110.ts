import type { CardScript } from '../../src/dsl.ts';

/** OP14-110 Dr. Hogback. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_110: CardScript = {
  cardId: 'OP14-110',
  textHash: '07a152e715da98',
  verified: {
    source: 'cards/overrides/OP14-110.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        'Play up to 1 Character with a cost of 4 or less and a [Trigger] other than [Dr. Hogback] from your trash',
      kind: 'auto',
      when: ['onKO'],
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
                    { cost: { lte: 4 } },
                    { hasTrigger: true },
                    { not: { name: 'Dr. Hogback' } },
                  ],
                },
                pick: { upTo: 1 },
              },
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
