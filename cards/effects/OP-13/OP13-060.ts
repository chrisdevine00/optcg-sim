import type { CardScript } from '../../src/dsl.ts';

/** OP13-060 Amatsuki Toki. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_060: CardScript = {
  cardId: 'OP13-060',
  textHash: '1cab313484ee9e',
  verified: {
    source: 'cards/overrides/OP13-060.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "Trash this Character instead of a {Roger Pirates} Character K.O.'d by your opponent's effect",
      kind: 'replacement',
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            typeIncludes: 'Roger Pirates',
          },
        },
        cause: 'opponentEffect',
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
    'reading: no "other than this Character", so Amatsuki Toki (a Roger Pirates type herself) may trash herself instead of being K.O.\'d (it still removes her; it only stops her [On K.O.] and a K.O. count). Only a K.O. by the opponent\'s effect is replaced: a battle K.O., a K.O. by your own effect and a return to hand are not',
  ],
};
