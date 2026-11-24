import type { CardScript } from '../../src/dsl.ts';

/** OP15-094 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_094: CardScript = {
  cardId: 'OP15-094',
  textHash: '1e6b8392085fbe',
  verified: {
    source: 'cards/overrides/OP15-094.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'cover',
      label:
        "If your {Straw Hat Crew} Character other than this Character would be removed from the field by your opponent's effect, you may trash this Character instead",
      kind: 'replacement',
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: { all: [{ type: 'Straw Hat Crew' }, { isSelf: false }] },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [{ trashSelf: true }],
    },
  ],
};
