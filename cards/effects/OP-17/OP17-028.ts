import type { CardScript } from '../../src/dsl.ts';

/** OP17-028 Bonk Punch & Monster. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_028: CardScript = {
  cardId: 'OP17-028',
  textHash: '038dda220c8ced',
  verified: {
    source: 'cards/overrides/OP17-028.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: "K.O. up to 1 of your opponent's rested Characters with a cost of 6 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                all: [
                  {
                    state: 'rested',
                  },
                  {
                    cost: {
                      lte: 6,
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
