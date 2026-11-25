import type { CardScript } from '../../src/dsl.ts';

/** OP11-005 Smoker. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_005: CardScript = {
  cardId: 'OP11-005',
  textHash: '09923e4bc2ab0a',
  verified: {
    source: 'cards/overrides/OP11-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'ko-guard',
      label:
        "[DON!! x1] This Character cannot be K.O.'d by effects of Characters without the <Special> attribute",
      kind: 'permanent',
      conditions: [{ donGiven: 1 }],
      apply: [
        {
          restrict: {
            target: { from: 'self', owner: 'you' },
            what: {
              cannotBeKOd: {
                cause: 'effect',
                by: {
                  all: [{ category: ['Character'] }, { not: { attribute: 'Special' } }],
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (G46, M6b-Q68): "effects" is either player\'s, a K.O. cost included; the source must be a Character whose printed attribute is not <Special>, so an effect of a Leader, Stage or Event does not qualify, and a K.O. with no source card is not stopped',
  ],
};
