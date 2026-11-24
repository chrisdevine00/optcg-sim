import type { CardScript } from '../../src/dsl.ts';

/** OP13-078 Oro Jackson. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_078: CardScript = {
  cardId: 'OP13-078',
  textHash: '0669c1ffe3874f',
  verified: {
    source: 'cards/overrides/OP13-078.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'removed',
      label:
        "Once per turn, when your {Roger Pirates} Character is removed by your opponent's effect: add up to 1 DON!! rested",
      kind: 'auto',
      when: [
        {
          event: 'removed',
          owner: 'you',
          filter: {
            all: [
              {
                category: ['Character'],
              },
              {
                typeIncludes: 'Roger Pirates',
              },
            ],
          },
          cause: 'opponentEffect',
        },
      ],
      oncePerTurn: true,
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'rested',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
  ],
  rulings: [
    "reading (M6b-Q20): any removal by the opponent's effect (K.O., trash, return to hand or deck) of a Character whose printed type includes Roger Pirates; a battle K.O. and your own effect do not count; the once per turn is spent only when it fires",
  ],
};
