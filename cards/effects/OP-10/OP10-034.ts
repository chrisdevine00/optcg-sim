import type { CardScript } from '../../src/dsl.ts';

/** OP10-034 Franky. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_034: CardScript = {
  cardId: 'OP10-034',
  textHash: '1cf8cfb45a7328',
  verified: {
    source: 'cards/overrides/OP10-034.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'life-shield',
      label:
        "Once per turn: if this Character would be K.O.'d in battle, you may add 1 card from the top of your Life cards to your hand instead",
      kind: 'replacement',
      oncePerTurn: true,
      optional: true,
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            isSelf: true,
          },
        },
        cause: 'battle',
      },
      instead: [
        {
          lifeToHand: {
            from: 'top',
            n: 1,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (RL-41): not damage, so no [Trigger]; unavailable with 0 Life; the Once Per Turn is spent only when the replacement is used',
  ],
};
