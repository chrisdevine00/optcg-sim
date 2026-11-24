import type { CardScript } from '../../src/dsl.ts';

/** OP11-083 Caribou. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_083: CardScript = {
  cardId: 'OP11-083',
  textHash: '017ed42faf5e94',
  verified: {
    source: 'cards/overrides/OP11-083.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label: 'Trash 2 cards from your hand',
      effect: [
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
};
