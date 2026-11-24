import type { CardScript } from '../../src/dsl.ts';

/** OP12-003 Crocus. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_003: CardScript = {
  cardId: 'OP12-003',
  textHash: '02a49134b52228',
  verified: {
    source: 'cards/overrides/OP12-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: 'Reveal 2 Events: play up to 1 red Character with 3000 power or less from your hand',
      kind: 'auto',
      when: ['onKO'],
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              category: ['Event'],
            },
            pick: {
              exactly: 2,
            },
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
                      color: 'Red',
                    },
                    {
                      category: ['Character'],
                    },
                    {
                      power: {
                        lte: 3000,
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
