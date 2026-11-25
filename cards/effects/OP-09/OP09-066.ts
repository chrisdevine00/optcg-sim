import type { CardScript } from '../../src/dsl.ts';

/** OP09-066 Jean Bart. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_066: CardScript = {
  cardId: 'OP09-066',
  textHash: '09ff48c0e2b05b',
  verified: {
    source: 'cards/overrides/OP09-066.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If your opponent has more DON!! cards on their field than you, K.O. up to 1 of your opponent's Characters with a cost of 3 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'opponent',
              },
              '>',
              {
                donOnField: 'you',
              },
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
                      lte: 3,
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
    'reading: DON!! on the field counts the cost area (active and rested) and DON!! given to cards, not the DON!! deck; strictly more; no colon, so an effect `if` checked as it resolves; "cost of 3 or less" is the current cost, inclusive',
  ],
};
