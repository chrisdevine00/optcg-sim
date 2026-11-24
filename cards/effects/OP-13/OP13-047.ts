import type { CardScript } from '../../src/dsl.ts';

/** OP13-047 Fossa. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_047: CardScript = {
  cardId: 'OP13-047',
  textHash: '035b3b838f6a76',
  verified: {
    source: 'cards/overrides/OP13-047.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        'If your Character with a type including "Whitebeard Pirates" would be K.O.\'d by your opponent\'s effect, you may trash this Character instead',
      kind: 'replacement',
      replaces: {
        ko: { from: 'characters', owner: 'you', filter: { typeIncludes: 'Whitebeard Pirates' } },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [{ trashSelf: true }],
    },
  ],
};
