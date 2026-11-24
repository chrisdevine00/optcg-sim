import type { CardScript } from '../../src/dsl.ts';

/** EB05-044 Ms. Father's Day. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_044: CardScript = {
  cardId: 'EB05-044',
  textHash: '005122028104ec',
  verified: {
    source: 'cards/overrides/EB05-044.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If your Leader is Baroque Works and your opponent has a cost 0 Character: opponent's Leader -1000 power this turn",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  typeIncludes: 'Baroque Works',
                },
              },
              {
                exists: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      eq: 0,
                    },
                  },
                },
              },
            ],
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: 'leader',
                    owner: 'opponent',
                  },
                  amount: -1000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
