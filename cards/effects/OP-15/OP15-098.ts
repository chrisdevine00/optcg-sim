import type { CardScript } from '../../src/dsl.ts';

/** OP15-098 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_098: CardScript = {
  cardId: 'OP15-098',
  textHash: '19bb389bcd64d6',
  verified: {
    source: 'cards/overrides/OP15-098.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        'If your {Sky Island} Character with 6000 base power or more would be removed from the field by your opponent, you may add 1 card from the top of your Life cards to your hand instead',
      kind: 'replacement',
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: { all: [{ type: 'Sky Island' }, { basePower: { gte: 6000 } }] },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [{ lifeToHand: { from: 'top', n: 1 } }],
    },
  ],
  rulings: [
    'RL-41: the Life-to-hand replacement cannot be used with 0 Life; it is not damage, so no [Trigger]',
    'reading: the data text says "removed from the field by your opponent" (no "effect"); read as the standard "by your opponent\'s effect", so a battle K.O. is not replaced',
  ],
};
