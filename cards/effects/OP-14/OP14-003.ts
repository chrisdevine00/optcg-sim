import type { CardScript } from '../../src/dsl.ts';

/** OP14-003 Capone"Gang"Bege. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_003: CardScript = {
  cardId: 'OP14-003',
  textHash: '01383cb4643e00',
  verified: {
    source: 'cards/overrides/OP14-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'ko-guard',
      label:
        "This Character cannot be K.O.'d by effects of your opponent's Characters with 5000 base power or less",
      kind: 'permanent',
      apply: [
        {
          restrict: {
            target: { from: 'self', owner: 'you' },
            what: {
              cannotBeKOd: {
                cause: 'opponentEffect',
                by: {
                  all: [{ category: ['Character'] }, { basePower: { lte: 5000 } }],
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "reading (G46, M6b-Q68): only an opponent's Character is a source that counts, read by its base (printed) power, so buffs and debuffs do not change it; battle K.O.s, your own effects, and effects of Leaders, Stages and Events are not stopped",
  ],
};
