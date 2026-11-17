import type { CardScript } from '../../src/dsl.ts';

/** OP16-078 Marineford. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_078: CardScript = {
  cardId: 'OP16-078',
  textHash: '15b1ff841bd50c',
  verified: {
    source: 'cards/overrides/OP16-078.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 5; reveal up to 1 {Navy} card to your hand; the rest to the bottom',
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
      ],
    },
    {
      id: 'cycle',
      label: 'DON!! -1, you may rest this Stage: draw 1 and trash 1 card from your hand',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          donMinus: 1,
        },
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            draw: 1,
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
  rulings: [
    'Non-Event activation: "You may rest this Stage" is part of the activation cost, which the player chooses to use (B-1)',
  ],
};
