import type { CardScript } from '../../src/dsl.ts';

/** OP13-023 Uta. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_023: CardScript = {
  cardId: 'OP13-023',
  textHash: '053d44b29e8ead',
  verified: {
    source: 'cards/overrides/OP13-023.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Set up to 2 DON!! active; you cannot play base cost 5+ Characters this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            setActive: {
              from: 'donCostArea',
              owner: 'you',
              pick: {
                upTo: 2,
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
                        gte: 5,
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
    {
      id: 'on-ko',
      label: 'Play up to 1 Character with cost 5 or less from your hand rested',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      cost: {
                        lte: 5,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              rested: true,
            },
          },
        },
      ],
    },
  ],
};
