import type { CardScript } from '../../src/dsl.ts';

/** OP17-087 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_087: CardScript = {
  cardId: 'OP17-087',
  textHash: '1d4bc51eab51f8',
  verified: {
    source: 'cards/overrides/OP17-087.json (card text in cards/data)',
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
        "If there is a Character with a cost of 12 or more, give up to 1 of your opponent's Characters -3000 power",
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
                power: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: -3000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
