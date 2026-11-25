import type { CardScript } from '../../src/dsl.ts';

/** EB02-054 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_054: CardScript = {
  cardId: 'EB02-054',
  textHash: '1bd086efcdc708',
  verified: {
    source: 'cards/overrides/EB02-054.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'If you have 2 or less Life cards, draw 2 cards and trash 1 card from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'you',
              },
              '<=',
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
  rulings: [
    'Read: the Life count is read when the effect resolves ("2 or less" includes 0); the trash is mandatory and may take a card just drawn',
  ],
};
