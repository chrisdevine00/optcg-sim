import type { CardScript } from '../../src/dsl.ts';

/** OP16-092 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_092: CardScript = {
  cardId: 'OP16-092',
  textHash: '0bf3d01e041b07',
  verified: {
    source: 'cards/overrides/OP16-092.json (card text in cards/data)',
    date: '2026-11-24',
  },
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
            filter: { all: [{ category: ['Character'] }, { cost: { gte: 8 } }] },
            pick: { exactly: 1 },
          },
        },
      ],
      effect: [{ do: { draw: 2 } }],
    },
  ],
};
