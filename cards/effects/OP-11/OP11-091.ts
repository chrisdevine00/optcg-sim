import type { CardScript } from '../../src/dsl.ts';

/** OP11-091 Berry Good. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_091: CardScript = {
  cardId: 'OP11-091',
  textHash: '067af35e383410',
  verified: {
    source: 'cards/overrides/OP11-091.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label:
        'Your opponent places 3 Events from their trash at the bottom of their deck in any order',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'trash',
                owner: 'opponent',
                chooser: 'opponent',
                filter: {
                  category: ['Event'],
                },
                pick: {
                  exactly: 3,
                },
              },
              to: {
                zone: 'deck',
                position: 'bottom',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the opponent chooses the Events and the order; with fewer than 3 Events in their trash they place all they have',
  ],
};
