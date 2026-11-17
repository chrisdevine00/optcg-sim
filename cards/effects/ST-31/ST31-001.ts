import type { CardScript } from '../../src/dsl.ts';

/** ST31-001 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST31_001: CardScript = {
  cardId: 'ST31-001',
  textHash: '1cbe5aa63173c0',
  verified: {
    source: 'cards/overrides/ST31-001.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'don-rush',
      label: '[DON!! x2] This Character gains [Rush]',
      kind: 'permanent',
      conditions: [
        {
          donGiven: 2,
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Rush',
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'Draw 1 card and play up to 1 {Straw Hat Crew} Character with cost 5 or less other than [Sanji]',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      type: 'Straw Hat Crew',
                    },
                    {
                      category: ['Character'],
                    },
                    {
                      cost: {
                        lte: 5,
                      },
                    },
                    {
                      not: {
                        name: 'Sanji',
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
    'Read: the card drawn first may be the one played ("Draw 1 card and play ..." resolves in order)',
  ],
};
