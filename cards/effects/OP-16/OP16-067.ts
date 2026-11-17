import type { CardScript } from '../../src/dsl.ts';

/** OP16-067 Tsuru. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_067: CardScript = {
  cardId: 'OP16-067',
  textHash: '0a4c87862c5d7b',
  verified: {
    source: 'cards/overrides/OP16-067.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 {Navy} card to your hand, the rest to the bottom; then trash 1 card from your hand',
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
                    type: 'Navy',
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
            trashFromHand: {
              from: 'hand',
              owner: 'you',
              pick: {
                exactly: 1,
              },
            },
          },
        },
      ],
    },
  ],
};
