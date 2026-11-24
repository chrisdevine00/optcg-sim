import type { CardScript } from '../../src/dsl.ts';

/** OP13-046 Vista. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_046: CardScript = {
  cardId: 'OP13-046',
  textHash: '076e44d330f760',
  verified: {
    source: 'cards/overrides/OP13-046.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Double Attack'],
  abilities: [
    {
      id: 'shield',
      label:
        "Once Per Turn: instead of this Character being K.O.'d or removed from the field by your opponent's effect, you may trash 1 {Whitebeard Pirates} card from your hand",
      kind: 'replacement',
      oncePerTurn: true,
      replaces: [
        { ko: { from: 'characters', owner: 'you', filter: { isSelf: true } } },
        {
          leaveField: { from: 'characters', owner: 'you', filter: { isSelf: true } },
          cause: 'opponentEffect',
        },
      ],
      optional: true,
      instead: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: { typeIncludes: 'Whitebeard Pirates' },
            pick: { exactly: 1 },
          },
        },
      ],
    },
  ],
  rulings: [
    "reading (M6b-Q6, still open): one Once Per Turn covers both events (a list of two entries is one ability): using it for a K.O. leaves none for a later removal the same turn; the first entry is a K.O. by any cause (including battle), the second only a removal by the opponent's effect",
    'reading: "a type including \\"Whitebeard Pirates\\"" is a substring of a type element (typeIncludes, CR 2-4-3-1); with no such card in hand the replacement cannot be paid',
  ],
};
