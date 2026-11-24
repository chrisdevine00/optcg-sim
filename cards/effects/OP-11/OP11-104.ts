import type { CardScript } from '../../src/dsl.ts';

/** OP11-104 Shirley. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_104: CardScript = {
  cardId: 'OP11-104',
  textHash: '1c3de30a322e67',
  verified: {
    source: 'cards/overrides/OP11-104.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label:
        'You may turn 1 Life card face-down: look at 3, reveal up to 1 "Fish-Man Island" card to your hand, place the rest at the top or bottom in any order',
      cost: [
        {
          turnLifeFaceDown: 1,
        },
      ],
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
                    type: 'Fish-Man Island',
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'topOrBottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
};
