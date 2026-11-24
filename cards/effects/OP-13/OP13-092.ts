import type { CardScript } from '../../src/dsl.ts';

/** OP13-092 Saint Mjosgard. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_092: CardScript = {
  cardId: 'OP13-092',
  textHash: '0f7ec46df84304',
  verified: {
    source: 'cards/overrides/OP13-092.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'With 3 or less Life, play up to 1 "Mary Geoise" Stage with cost 1 from trash',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [
        {
          cmp: [
            {
              life: 'you',
            },
            '<=',
            3,
          ],
        },
      ],
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
                      category: ['Stage'],
                    },
                    {
                      type: 'Mary Geoise',
                    },
                    {
                      cost: {
                        eq: 1,
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
