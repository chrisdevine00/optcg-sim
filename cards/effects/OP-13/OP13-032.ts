import type { CardScript } from '../../src/dsl.ts';

/** OP13-032 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_032: CardScript = {
  cardId: 'OP13-032',
  textHash: '15842c5afff199',
  verified: {
    source: 'cards/overrides/OP13-032.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Up to 1 of the opponent's Characters with a cost of 8 or less cannot be rested until the end of their next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: { cost: { lte: 8 } },
                pick: { upTo: 1 },
              },
              what: 'cannotBeRested',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
};
