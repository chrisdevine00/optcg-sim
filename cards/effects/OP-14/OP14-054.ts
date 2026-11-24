import type { CardScript } from '../../src/dsl.ts';

/** OP14-054 Fisher Tiger. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_054: CardScript = {
  cardId: 'OP14-054',
  textHash: '0b48c3a956c8e1',
  verified: {
    source: 'cards/overrides/OP14-054.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If your Leader has the {Fish-Man} type, draw 3 cards',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Fish-Man',
            },
          },
          then: [
            {
              do: {
                draw: 3,
              },
            },
          ],
        },
      ],
    },
    {
      id: 'end',
      label: 'Trash cards from your hand until you have 5 cards in your hand',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          forEach: {
            sum: [
              {
                hand: 'you',
              },
              -5,
            ],
          },
          do: [
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
