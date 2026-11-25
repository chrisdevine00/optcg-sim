import type { CardScript } from '../../src/dsl.ts';

/** OP09-030 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_030: CardScript = {
  cardId: 'OP09-030',
  textHash: '114955bf5aa6a6',
  verified: {
    source: 'cards/overrides/OP09-030.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may return 1 of your Characters to your hand: play up to 1 {ODYSSEY} Character with a cost of 3 or less other than [Trafalgar Law] from your hand',
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
                      type: 'ODYSSEY',
                    },
                    {
                      cost: {
                        lte: 3,
                      },
                    },
                    {
                      not: {
                        name: 'Trafalgar Law',
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
    },
  ],
  rulings: [
    'reading (G1): the returned Character is any of your Characters, Law himself included; the play is offered after the cost whether or not a matching card is in the hand (no prompt depends on the hand)',
  ],
};
