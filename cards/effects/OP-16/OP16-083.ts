import type { CardScript } from '../../src/dsl.ts';

/** OP16-083 Kouzuki Oden. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_083: CardScript = {
  cardId: 'OP16-083',
  textHash: '025eef1fe73f26',
  verified: {
    source: 'cards/overrides/OP16-083.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'Trash 1 Character with a cost of 8 or more from your hand: draw 2',
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
                  cost: {
                    gte: 8,
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
