import type { CardScript } from '../../src/dsl.ts';

/** OP11-046 Vinsmoke Yonji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_046: CardScript = {
  cardId: 'OP11-046',
  textHash: '191b4bf7649ef2',
  verified: {
    source: 'cards/overrides/OP11-046.json (card text in cards/data)',
    date: '2026-11-25',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'guard',
      label:
        'If you only have Characters with a type including "GERMA", this Character cannot be K.O.\'d or rested by your opponent\'s effects',
      kind: 'permanent',
      conditions: [
        {
          none: {
            from: 'characters',
            owner: 'you',
            filter: { not: { typeIncludes: 'GERMA' } },
          },
        },
      ],
      apply: [
        {
          restrict: {
            target: { from: 'self', owner: 'you' },
            what: { cannotBeKOd: { cause: 'opponentEffect' } },
          },
        },
        {
          restrict: {
            target: { from: 'self', owner: 'you' },
            what: { cannotBeRested: { by: 'opponentEffect' } },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "a type including GERMA" is a substring match (CR 2-4-3-1), so {GERMA 66} and {GERMA Kingdom} both count; Yonji is {GERMA 66} himself, so the condition is never vacuous (M6b-Q21 does not apply)',
    'reading: "cannot be K.O.\'d or rested by your opponent\'s effects" is both protections under the one condition; your own effects, costs, attacks and blocks are not stopped',
  ],
};
