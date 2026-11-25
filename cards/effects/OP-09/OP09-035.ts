import type { CardScript } from '../../src/dsl.ts';

/** OP09-035 Portgas.D.Ace. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_035: CardScript = {
  cardId: 'OP09-035',
  textHash: '1f5df075bbd53d',
  verified: {
    source: 'cards/overrides/OP09-035.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If you have 2 or more rested Characters, rest up to 1 of your opponent's Characters with a cost of 5 or less",
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
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 5,
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
    'reading: no colon, so an effect `if` checked as it resolves; Ace is played active and does not count herself; "cost of 5 or less" is the current cost',
  ],
};
