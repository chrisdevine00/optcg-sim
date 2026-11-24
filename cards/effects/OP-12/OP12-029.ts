import type { CardScript } from '../../src/dsl.ts';

/** OP12-029 Shimotsuki Kouzaburou. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_029: CardScript = {
  cardId: 'OP12-029',
  textHash: '0c4751dbbe8fc3',
  verified: {
    source: 'cards/overrides/OP12-029.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Rest up to 1 of your opponent's Characters with cost 2 or less; then K.O. up to 1 of their rested Characters with base cost 1 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 2,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
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
                    baseCost: {
                      lte: 1,
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
  rulings: [
    'Read: "Then" is not "If you do": the K.O. runs even when nothing was rested, and may take a Character that was already rested',
  ],
};
