import type { CardScript } from '../../src/dsl.ts';

/** OP09-040 Thunder Lance Flip Caliber Phoenix Shot. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_040: CardScript = {
  cardId: 'OP09-040',
  textHash: '0dfe5371b3d65e',
  verified: {
    source: 'cards/overrides/OP09-040.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "[Main] With 2 or more rested Characters, K.O. up to 1 of your opponent's Characters with a cost of 4 or less",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    state: 'rested',
                  },
                },
              },
              '>=',
              2,
            ],
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 4,
                    },
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
    },
    {
      id: 'trigger',
      label: "Rest up to 1 of your opponent's Characters with a cost of 4 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 4,
                },
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
    'reading: the 2 rested Characters are yours (the text says "you have"); the "If" has no cost colon, so it is an effect condition read when the [Main] resolves',
  ],
};
