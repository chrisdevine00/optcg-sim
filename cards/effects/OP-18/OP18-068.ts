import type { CardScript } from '../../src/dsl.ts';

/** OP18-068 Senor Pink. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_068: CardScript = {
  cardId: 'OP18-068',
  textHash: '1f6018aed9ac35',
  verified: {
    source: 'cards/overrides/OP18-068.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'shield',
      label: "If this Character would be K.O.'d, you may DON!! −1 instead",
      kind: 'replacement',
      oncePerTurn: true,
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            isSelf: true,
          },
        },
      },
      optional: true,
      instead: [
        {
          returnDon: 1,
        },
      ],
    },
    {
      id: 'on-play',
      label:
        "DON!! −1: up to 1 of your opponent's Characters with a cost of 7 or less cannot be rested until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  cost: {
                    lte: 7,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              what: 'cannotBeRested',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "DON!! −1 instead" is returning 1 DON!! from your field to your DON!! deck in place of the K.O. (as OP12-070); any K.O. cause, battle included; once per turn',
  ],
};
