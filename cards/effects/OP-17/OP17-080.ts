import type { CardScript } from '../../src/dsl.ts';

/** OP17-080 Usopp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_080: CardScript = {
  cardId: 'OP17-080',
  textHash: '06eab00e3a0563',
  verified: {
    source: 'cards/overrides/OP17-080.json (card text in cards/data)',
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
      label: 'Look at 3; add up to 1 {Elbaph} card; trash the rest',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    type: 'Elbaph',
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'trash',
            },
          },
        },
      ],
    },
  ],
};
