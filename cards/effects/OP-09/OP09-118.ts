import type { CardScript } from '../../src/dsl.ts';

/** OP09-118 Gol.D.Roger. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_118: CardScript = {
  cardId: 'OP09-118',
  textHash: '1215cf909876eb',
  verified: {
    source: 'cards/overrides/OP09-118.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Rush'],
  abilities: [
    {
      id: 'win',
      label:
        'When your opponent activates [Blocker], if either player has 0 Life cards, you win the game',
      kind: 'auto',
      when: [
        {
          event: 'blockerActivated',
          by: 'opponent',
        },
      ],
      effect: [
        {
          if: {
            any: [
              {
                cmp: [
                  {
                    life: 'you',
                  },
                  '=',
                  0,
                ],
              },
              {
                cmp: [
                  {
                    life: 'opponent',
                  },
                  '=',
                  0,
                ],
              },
            ],
          },
          then: [
            {
              do: {
                winGame: true,
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "if either you or your opponent has 0 Life cards" is an effect condition read when the trigger resolves, after the [Blocker] was activated and its rest cost paid',
    "reading: only a [Blocker] activated by the opponent triggers it (not your own); it triggers on either player's turn, since the text has no turn condition",
  ],
};
