import type { CardScript } from '../../src/dsl.ts';

/** OP13-095 Saint Rosward. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_095: CardScript = {
  cardId: 'OP13-095',
  textHash: '03a011cd704353',
  verified: {
    source: 'cards/overrides/OP13-095.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Trash 1 from hand: if you only have {Celestial Dragons} Characters, K.O. up to 2 of opponent's Characters with base cost 3 or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          if: {
            all: [
              {
                exists: {
                  from: 'characters',
                  owner: 'you',
                },
              },
              {
                none: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    not: {
                      type: 'Celestial Dragons',
                    },
                  },
                },
              },
            ],
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    baseCost: {
                      lte: 3,
                    },
                  },
                  pick: {
                    upTo: 2,
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
