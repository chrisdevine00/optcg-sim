import type { CardScript } from '../../src/dsl.ts';

/** OP09-036 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_036: CardScript = {
  cardId: 'OP09-036',
  textHash: '1a90226cbc274d',
  verified: {
    source: 'cards/overrides/OP09-036.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If you have 2 or more rested Characters, rest up to 1 of your opponent's DON!! cards or Characters with a cost of 6 or less",
      kind: 'auto',
      when: ['onPlay'],
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
                rest: {
                  from: ['characters', 'donCostArea'],
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 6,
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
  ],
  rulings: [
    'reading: one pick over the opponent\'s Characters and cost-area DON!!; "with a cost of 6 or less" qualifies the Characters only (a DON!! card has no cost), as ST26-002; only an active DON!! can be rested; no colon, so an effect `if`',
  ],
};
