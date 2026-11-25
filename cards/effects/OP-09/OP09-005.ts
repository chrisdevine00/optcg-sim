import type { CardScript } from '../../src/dsl.ts';

/** OP09-005 Silvers Rayleigh. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_005: CardScript = {
  cardId: 'OP09-005',
  textHash: '16582821892462',
  verified: {
    source: 'cards/overrides/OP09-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'If your opponent has 2 or more Characters with a base power of 5000 or more, draw 2 cards and trash 1 card from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    basePower: {
                      gte: 5000,
                    },
                  },
                },
              },
              '>=',
              2,
            ],
          },
          then: [
            {
              do: {
                draw: 2,
              },
            },
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'you',
                  pick: {
                    exactly: 1,
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
