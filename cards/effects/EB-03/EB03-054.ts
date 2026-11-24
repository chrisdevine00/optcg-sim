import type { CardScript } from '../../src/dsl.ts';

/** EB03-054 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_054: CardScript = {
  cardId: 'EB03-054',
  textHash: '0f622b71810380',
  verified: {
    source: 'cards/overrides/EB03-054.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may trash 1 card from the top of your Life cards: add up to 1 card from the top of your deck to the top of your Life cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ trashLife: 1 }],
      effect: [
        {
          do: {
            move: {
              what: { from: 'deckTop', owner: 'you', pick: { upTo: 1 } },
              to: { zone: 'life', position: 'top' },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'You may trash 1 card from your hand: play this card',
      kind: 'trigger',
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
    },
  ],
  rulings: [
    'G30: the Life card is trashed face up as a cost (not damage, no [Trigger]); the cost needs 1 Life card',
  ],
};
