import type { CardScript } from '../../src/dsl.ts';

/** EB05-023 Osome. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_023: CardScript = {
  cardId: 'EB05-023',
  textHash: '06547e3ca8f0e0',
  verified: {
    source: 'cards/overrides/EB05-023.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'May trash 2 Events from your hand: draw 3 cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              category: ['Event'],
            },
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 3,
          },
        },
      ],
    },
  ],
};
