import type { CardScript } from '../../src/dsl.ts';

/** OP13-031 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_031: CardScript = {
  cardId: 'OP13-031',
  textHash: '0d7c49856a9d2d',
  verified: {
    source: 'cards/overrides/OP13-031.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label: 'With 1 or less Life, gains Blocker',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              life: 'you',
            },
            '<=',
            1,
          ],
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Blocker',
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'Return 1 of your Characters to hand: play up to 1 Character with cost 5 or less from your hand rested',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          move: {
            from: 'characters',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
          to: {
            zone: 'hand',
          },
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      cost: {
                        lte: 5,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              rested: true,
            },
          },
        },
      ],
    },
  ],
};
