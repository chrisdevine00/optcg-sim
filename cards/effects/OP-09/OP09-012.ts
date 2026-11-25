import type { CardScript } from '../../src/dsl.ts';

/** OP09-012 Monster. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_012: CardScript = {
  cardId: 'OP09-012',
  textHash: '063606d8ee6fcd',
  verified: {
    source: 'cards/overrides/OP09-012.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "If your [Bonk Punch] would be K.O.'d by an effect, you may trash this Character instead",
      kind: 'replacement',
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            name: 'Bonk Punch',
          },
        },
        cause: 'effect',
      },
      optional: true,
      instead: [
        {
          trashSelf: true,
        },
      ],
    },
  ],
  rulings: [
    'reading (G11): "by an effect" is an effect of either player, a cost included, and not a battle K.O.; no Once Per Turn on the text, so it can be used every time',
  ],
};
