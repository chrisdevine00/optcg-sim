import type { CardScript } from '../../src/dsl.ts';

/** OP11-109 Pappag. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_109: CardScript = {
  cardId: 'OP11-109',
  textHash: '187797296415e9',
  verified: {
    source: 'cards/overrides/OP11-109.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label: 'If you have [Camie], draw 2 cards and trash 2 cards from your hand',
      conditions: [
        {
          exists: {
            from: ['leader', 'characters'],
            owner: 'you',
            filter: {
              name: 'Camie',
            },
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 2,
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
      ],
    },
  ],
  rulings: ['reading: "you have [Camie]" is a [Camie] on your field (Leader or Character area)'],
};
