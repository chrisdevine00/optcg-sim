import type { CardScript } from '../../src/dsl.ts';

/** OP15-088 Pirates Docking Six. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_088: CardScript = {
  cardId: 'OP15-088',
  textHash: '14ec5f6b4cf412',
  verified: {
    source: 'cards/overrides/OP15-088.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'tall',
      label: 'This Character gains +6 cost',
      kind: 'permanent',
      apply: [
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 6,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'Trash 3 cards from the top of your deck: play up to 1 {Straw Hat Crew} Character with a cost of 2 or less from your trash',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Straw Hat Crew',
                    },
                    {
                      cost: {
                        lte: 2,
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
        },
      ],
      cost: [
        {
          mill: 3,
        },
      ],
    },
  ],
  rulings: [
    'QA-OP17 (OP17-085, OP17-089) via RL-43: a self "+N cost" applies only on the field',
    'reading: the cards trashed as the cost are in the trash when the effect resolves, so one of them may be played',
  ],
};
