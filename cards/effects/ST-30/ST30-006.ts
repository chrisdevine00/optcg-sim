import type { CardScript } from '../../src/dsl.ts';

/** ST30-006 Jinbe. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST30_006: CardScript = {
  cardId: 'ST30-006',
  textHash: '1b75415275a1cb',
  verified: {
    source: 'cards/overrides/ST30-006.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'You may trash 1 Character card with 6000 power from your hand: draw 2 cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              all: [
                {
                  category: ['Character'],
                },
                {
                  power: {
                    eq: 6000,
                  },
                },
              ],
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
