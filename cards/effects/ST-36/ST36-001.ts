import type { CardScript } from '../../src/dsl.ts';

/** ST36-001 Cavendish. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST36_001: CardScript = {
  cardId: 'ST36-001',
  textHash: '1a4c3a607e5a0b',
  verified: {
    source: 'cards/overrides/ST36-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        'You may trash 1 card from your hand: add up to 1 card from the top of your deck to the top of your Life cards',
      kind: 'auto',
      when: ['onKO'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
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
  ],
};
