import type { CardScript } from '../../src/dsl.ts';

/** EB02-003 Tony Tony.Chopper. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_003: CardScript = {
  cardId: 'EB02-003',
  textHash: '107cb6efb5c056',
  verified: {
    source: 'cards/overrides/EB02-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-turn-power',
      label: "[DON!! x2] [Opponent's Turn] +2000 power",
      kind: 'permanent',
      conditions: [
        {
          donGiven: 2,
        },
        {
          opponentsTurn: true,
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 2000,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'If your Leader has {Straw Hat Crew}: give up to 1 rested DON!! to your Leader or 1 of your Characters',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Straw Hat Crew',
            },
          },
          then: [
            {
              do: {
                giveDon: {
                  n: 1,
                  state: 'rested',
                  to: {
                    from: ['leader', 'characters'],
                    owner: 'you',
                    pick: {
                      exactly: 1,
                    },
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
    'reading: as OP11-016: "up to 1" with n 1 asks no count; the DON!! is a rested cost-area DON!! and nothing happens without one',
    'reading: [DON!! x2] is two DON!! given to this Character (CR 8-3-2-3)',
  ],
};
