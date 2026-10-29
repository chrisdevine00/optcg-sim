import type { CardScript } from '../../src/dsl.ts';

/** OP17-075 X.Drake. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_075: CardScript = {
  cardId: 'OP17-075',
  textHash: '04b486eac7d758',
  verified: {
    source: 'cards/overrides/OP17-075.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Trash 1 card from your opponent's hand",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 2,
        },
      ],
      effect: [
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'opponent',
              chooser: 'you',
              blind: true,
              pick: {
                exactly: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: ['QA-OP17 OP17-075: the player who activated it chooses face-down (here: at random)'],
};
