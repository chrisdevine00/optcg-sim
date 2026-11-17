import type { CardScript } from '../../src/dsl.ts';

/** OP15-077 Lightning Dragon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_077: CardScript = {
  cardId: 'OP15-077',
  textHash: '0959eec92292f9',
  verified: {
    source: 'cards/overrides/OP15-077.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label:
        'DON!! -1: draw 1; then up to 1 opposing rested Character with 6000 power or less will not become active in the next Refresh Phase',
      kind: 'activate',
      when: 'main',
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            skipRefresh: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                all: [
                  {
                    state: 'rested',
                  },
                  {
                    power: {
                      lte: 6000,
                    },
                  },
                ],
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
};
