import type { CardScript } from '../../src/dsl.ts';

/** OP15-105 Jewelry Bonney. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_105: CardScript = {
  cardId: 'OP15-105',
  textHash: '01e3900cd3d46f',
  verified: {
    source: 'cards/overrides/OP15-105.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "If your Character with 7000 base power or less would be removed from the field by your opponent's effect, you may add 1 card from the top of your Life cards to your hand instead",
      kind: 'replacement',
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: { basePower: { lte: 7000 } },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [{ lifeToHand: { from: 'top', n: 1 } }],
    },
  ],
  rulings: [
    'RL-41: the Life-to-hand replacement cannot be used with 0 Life; it is not damage, so no [Trigger]',
  ],
};
