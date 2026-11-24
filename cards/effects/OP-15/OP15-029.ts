import type { CardScript } from '../../src/dsl.ts';

/** OP15-029 Bartholomew Kuma. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_029: CardScript = {
  cardId: 'OP15-029',
  textHash: '1e42f034b9de5f',
  verified: {
    source: 'cards/overrides/OP15-029.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Up to 1 opposing Character with a cost of 5 or less cannot be rested until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: { cost: { lte: 5 } },
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
  rulings: [
    'reading: unscoped "cannot be rested": the Character cannot attack, block or be rested by any effect or cost until the end of the opponent\'s next turn',
  ],
};
