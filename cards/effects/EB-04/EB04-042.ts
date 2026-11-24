import type { CardScript } from '../../src/dsl.ts';

/** EB04-042 Alpha. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_042: CardScript = {
  cardId: 'EB04-042',
  textHash: '0e29598fde86aa',
  verified: {
    source: 'cards/overrides/EB04-042.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may trash 3 cards from the top of your deck: give up to 1 opposing Character -1 cost during this turn',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          mill: 3,
        },
      ],
      effect: [
        {
          do: {
            cost: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -1,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
