import type { CardScript } from '../../src/dsl.ts';

/** OP12-030 Dracule Mihawk. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_030: CardScript = {
  cardId: 'OP12-030',
  textHash: '1b56441ccab989',
  verified: {
    source: 'cards/overrides/OP12-030.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'Set up to 4 DON!! as active; you cannot play Characters with base cost 7 or more this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            setActive: {
              from: 'donCostArea',
              owner: 'you',
              pick: {
                upTo: 4,
              },
            },
          },
        },
        {
          do: {
            restrict: {
              target: 'you',
              what: {
                cannotPlay: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      baseCost: {
                        gte: 7,
                      },
                    },
                  ],
                },
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
