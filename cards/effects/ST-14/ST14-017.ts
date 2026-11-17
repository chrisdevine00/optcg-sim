import type { CardScript } from '../../src/dsl.ts';

/** ST14-017 Thousand Sunny. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST14_017: CardScript = {
  cardId: 'ST14-017',
  textHash: '1ffc718f0e4338',
  verified: {
    source: 'cards/overrides/ST14-017.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'sunny',
      label: 'All your black {Straw Hat Crew} Characters gain +1 cost',
      kind: 'permanent',
      apply: [
        {
          cost: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    color: 'Black',
                  },
                  {
                    type: 'Straw Hat Crew',
                  },
                ],
              },
            },
            amount: 1,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label: 'If your Leader has the {Straw Hat Crew} type, draw 1 card',
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
                draw: 1,
              },
            },
          ],
        },
      ],
    },
  ],
};
