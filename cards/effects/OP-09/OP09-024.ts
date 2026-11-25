import type { CardScript } from '../../src/dsl.ts';

/** OP09-024 Usopp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_024: CardScript = {
  cardId: 'OP09-024',
  textHash: '0c7a6528c23312',
  verified: {
    source: 'cards/overrides/OP09-024.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If you have 2 or more rested Characters, draw 2 cards and trash 2 cards from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    state: 'rested',
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
                    exactly: 2,
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
