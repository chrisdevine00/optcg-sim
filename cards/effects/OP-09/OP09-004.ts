import type { CardScript } from '../../src/dsl.ts';

/** OP09-004 Shanks. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_004: CardScript = {
  cardId: 'OP09-004',
  textHash: '0090148d65f03a',
  verified: {
    source: 'cards/overrides/OP09-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Rush'],
  abilities: [
    {
      id: 'aura',
      label: "All of your opponent's Characters get -1000 power",
      kind: 'permanent',
      apply: [
        {
          power: {
            target: {
              from: 'characters',
              owner: 'opponent',
            },
            amount: -1000,
          },
        },
      ],
    },
  ],
  rulings: [
    "reading: the text has no timing, so it is a continuous effect while this Character is on the field (both turns), also covering Characters the opponent plays later; it never touches the opponent's Leader",
  ],
};
