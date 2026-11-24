import type { CardScript } from '../../src/dsl.ts';

/** OP14-048 Shiryu. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_048: CardScript = {
  cardId: 'OP14-048',
  textHash: '1fe257645abe50',
  verified: {
    source: 'cards/overrides/OP14-048.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Return up to 1 of your opponent's Characters to the owner's hand; then trash all cards from your hand",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'you',
            },
          },
        },
      ],
    },
  ],
  rulings: ['"Then" is not "If you do": the hand is trashed even when nothing was returned'],
};
