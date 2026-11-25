import type { CardScript } from '../../src/dsl.ts';

/** OP09-014 Limejuice. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_014: CardScript = {
  cardId: 'OP09-014',
  textHash: '02939fa1322db4',
  verified: {
    source: 'cards/overrides/OP09-014.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Up to 1 of your opponent's [Blocker] Characters with 4000 power or less cannot activate [Blocker] during this turn",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  all: [
                    {
                      keyword: 'Blocker',
                    },
                    {
                      power: {
                        lte: 4000,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              what: 'cannotActivateBlocker',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "[Blocker] Character" is a Character that has [Blocker] now (printed or gained); the target is chosen when the effect resolves (a snapshot) and 4000 is its current power',
  ],
};
