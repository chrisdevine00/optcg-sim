import type { CardScript } from '../../src/dsl.ts';

/** OP16-026 Emporio.Ivankov. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_026: CardScript = {
  cardId: 'OP16-026',
  textHash: '0c1f6b366245e2',
  verified: {
    source: 'cards/overrides/OP16-026.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 3, reveal up to 1 {Impel Down} card to hand, the rest to the bottom; then play up to 1 Character card with a cost of 2 or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
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
                    type: 'Impel Down',
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      cost: {
                        lte: 2,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
