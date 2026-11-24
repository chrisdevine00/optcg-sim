import type { CardScript } from '../../src/dsl.ts';

/** ST30-011 Buggy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST30_011: CardScript = {
  cardId: 'ST30-011',
  textHash: '1f29de421aa00f',
  verified: {
    source: 'cards/overrides/ST30-011.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'shield',
      label:
        "If your Character with 6000 base power would be removed from the field by your opponent's effect, you may rest this Character instead",
      kind: 'replacement',
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            basePower: {
              eq: 6000,
            },
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          restSelf: true,
        },
      ],
    },
  ],
  rulings: [
    'G14 reading: Buggy itself (1000 base) is never protected; a rested Buggy cannot pay the rest, so the replacement is not offered',
  ],
};
