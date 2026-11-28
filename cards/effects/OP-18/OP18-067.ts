import type { CardScript } from '../../src/dsl.ts';

/** OP18-067 Charlotte Smoothie. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_067: CardScript = {
  cardId: 'OP18-067',
  textHash: '0f4bf91a071b89',
  verified: {
    source: 'cards/overrides/OP18-067.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'You may trash 1 {Big Mom Pirates} type card from your hand: draw 2 cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              type: 'Big Mom Pirates',
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 2,
          },
        },
      ],
    },
  ],
};
