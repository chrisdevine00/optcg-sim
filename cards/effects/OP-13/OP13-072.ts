import type { CardScript } from '../../src/dsl.ts';

/** OP13-072 Buggy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_072: CardScript = {
  cardId: 'OP13-072',
  textHash: '096144f06ea060',
  verified: {
    source: 'cards/overrides/OP13-072.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'With a {Roger Pirates} Leader and any DON!! given: add up to 1 DON!! rested',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  typeIncludes: 'Roger Pirates',
                },
              },
              {
                cmp: [
                  {
                    donGiven: 'you',
                  },
                  '>=',
                  1,
                ],
              },
            ],
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 1,
                    state: 'rested',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: ['reading: both conditions are needed (an "and"); either failing does nothing'],
};
