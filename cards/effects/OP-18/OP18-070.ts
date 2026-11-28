import type { CardScript } from '../../src/dsl.ts';

/** OP18-070 Tom. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_070: CardScript = {
  cardId: 'OP18-070',
  textHash: '1bd503de8f6e82',
  verified: {
    source: 'cards/overrides/OP18-070.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'DON!! −1, you may trash 1 card from your hand: add up to 2 Stage cards from your trash to your hand',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ donMinus: 1 }, { trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: { category: ['Stage'] },
                pick: { upTo: 2 },
              },
              to: { zone: 'hand' },
            },
          },
        },
      ],
    },
  ],
};
