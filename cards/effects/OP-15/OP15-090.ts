import type { CardScript } from '../../src/dsl.ts';

/** OP15-090 Perona. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_090: CardScript = {
  cardId: 'OP15-090',
  textHash: '184999b301aa70',
  verified: {
    source: 'cards/overrides/OP15-090.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "If your Character with 7000 base power or less would be removed from the field by your opponent's effect, you may trash 1 card from your hand instead",
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
      instead: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
    },
  ],
};
