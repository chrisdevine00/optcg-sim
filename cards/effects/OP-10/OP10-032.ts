import type { CardScript } from '../../src/dsl.ts';

/** OP10-032 Tashigi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_032: CardScript = {
  cardId: 'OP10-032',
  textHash: '00388789633f12',
  verified: {
    source: 'cards/overrides/OP10-032.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "If your green Character other than [Tashigi] would be removed from the field by your opponent's effect, you may rest this Character instead",
      kind: 'replacement',
      optional: true,
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            all: [
              {
                color: 'Green',
              },
              {
                not: {
                  name: 'Tashigi',
                },
              },
            ],
          },
        },
        cause: 'opponentEffect',
      },
      instead: [
        {
          restSelf: true,
        },
      ],
    },
  ],
  rulings: [
    'reading: any move off the field by the opponent\'s effect (K.O., trash, return to hand or deck) is "removed"; a rested [Tashigi] cannot pay; no Once Per Turn on the text, so each removal can be shielded',
  ],
};
