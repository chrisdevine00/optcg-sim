import type { CardScript } from '../../src/dsl.ts';

/** OP17-093 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_093: CardScript = {
  cardId: 'OP17-093',
  textHash: '1b8132ba0e2073',
  verified: {
    source: 'cards/overrides/OP17-093.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'big-rush',
      label: 'With a Character of cost 12 or more, this Character gains [Rush]',
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
      label: 'Draw 1 card and play up to 1 Character with a cost of 2 or less from your trash',
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
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
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
    },
  ],
};
