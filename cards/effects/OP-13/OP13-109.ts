import type { CardScript } from '../../src/dsl.ts';

/** OP13-109 Jewelry Bonney. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_109: CardScript = {
  cardId: 'OP13-109',
  textHash: '08f99468a99b4f',
  verified: {
    source: 'cards/overrides/OP13-109.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'protect',
      label: 'If removed by opponent effect, you may turn 1 Life card face-up instead',
      kind: 'replacement',
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            isSelf: true,
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          turnLifeFaceUp: 1,
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 2 cards and trash 1 card from your hand',
      kind: 'trigger',
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
                exactly: 1,
              },
            },
          },
        },
      ],
    },
  ],
};
