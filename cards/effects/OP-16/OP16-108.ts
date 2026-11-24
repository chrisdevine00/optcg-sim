import type { CardScript } from '../../src/dsl.ts';

/** OP16-108 Shiryu. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_108: CardScript = {
  cardId: 'OP16-108',
  textHash: '118d952b6b81d3',
  verified: {
    source: 'cards/overrides/OP16-108.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Trash 1 card from your hand: add up to 1 {Blackbeard Pirates} card (cost 6 or less) from your trash to the top of your Life face-up',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: { all: [{ type: 'Blackbeard Pirates' }, { cost: { lte: 6 } }] },
                pick: { upTo: 1 },
              },
              to: { zone: 'life', position: 'top', faceUp: true },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 2 cards',
      kind: 'trigger',
      effect: [{ do: { draw: 2 } }],
    },
  ],
  rulings: [
    'reading: "a {Blackbeard Pirates} type card" is any category (Event and Stage included); a cost filter reads the printed cost in the trash',
  ],
};
