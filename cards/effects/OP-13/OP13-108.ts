import type { CardScript } from '../../src/dsl.ts';

/** OP13-108 Jewelry Bonney. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_108: CardScript = {
  cardId: 'OP13-108',
  textHash: '16313b6be7515e',
  verified: {
    source: 'cards/overrides/OP13-108.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has {Egghead}, gains [Rush] this turn; then your opponent adds 1 card from top of their Life to hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Egghead',
            },
          },
          then: [
            {
              do: {
                grant: {
                  target: {
                    from: 'self',
                    owner: 'you',
                  },
                  keyword: 'Rush',
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
        {
          do: {
            move: {
              what: {
                from: 'lifeTop',
                owner: 'opponent',
                pick: {
                  exactly: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        "If you have 1 or less Life, rest up to 1 of opponent's Characters with cost 7 or less",
      kind: 'trigger',
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'you',
              },
              '<=',
              1,
            ],
          },
          then: [
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 7,
                    },
                  },
                  pick: {
                    upTo: 1,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
