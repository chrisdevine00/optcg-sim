import type { CardScript } from '../../src/dsl.ts';

/** OP17-090 Franky. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_090: CardScript = {
  cardId: 'OP17-090',
  textHash: '1e9ed29a6a88f0',
  verified: {
    source: 'cards/overrides/OP17-090.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'big-power',
      label: '+3000 power while a Character with a cost of 12 or more exists',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'any',
            filter: {
              cost: {
                gte: 12,
              },
            },
          },
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 3000,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        "If there is a Character with a cost of 12 or more, K.O. up to 1 of your opponent's Characters with a cost of 2 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'any',
              filter: {
                cost: {
                  gte: 12,
                },
              },
            },
          },
          then: [
            {
              do: {
                ko: {
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
          ],
        },
      ],
    },
  ],
};
