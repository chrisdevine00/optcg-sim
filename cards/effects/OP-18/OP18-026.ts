import type { CardScript } from '../../src/dsl.ts';

/** OP18-026 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_026: CardScript = {
  cardId: 'OP18-026',
  textHash: '0935a1af9c1cc3',
  verified: {
    source: 'cards/overrides/OP18-026.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'cover',
      label:
        "If your {Straw Hat Crew} type Character would be removed from the field by your opponent's effect, you may trash this Character instead",
      kind: 'replacement',
      replaces: {
        leaveField: { from: 'characters', owner: 'you', filter: { type: 'Straw Hat Crew' } },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [{ trashSelf: true }],
    },
  ],
  rulings: [
    'reading: unlike OP15-094 the text has no "other than this Character", so it covers itself too (trashing itself instead of, say, a return to hand); no Once Per Turn',
  ],
};
