import type { CardScript } from '../../src/dsl.ts';

/** OP16-072 Hannyabal. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_072: CardScript = {
  cardId: 'OP16-072',
  textHash: '14d6b0c0ec2ec9',
  verified: {
    source: 'cards/overrides/OP16-072.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 5; reveal up to 1 {Impel Down} card to your hand; the rest to the bottom',
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
      ],
    },
  ],
};
