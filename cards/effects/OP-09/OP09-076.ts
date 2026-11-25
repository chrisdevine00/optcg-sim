import type { CardScript } from '../../src/dsl.ts';

/** OP09-076 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_076: CardScript = {
  cardId: 'OP09-076',
  textHash: '0b6c5060ca12cf',
  verified: {
    source: 'cards/overrides/OP09-076.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may return 1 or more DON!! cards from your field to your DON!! deck: add up to 1 DON!! card from your DON!! deck and set it as active',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ returnDon: { atLeast: 1 } }],
      effect: [{ do: { addDon: [{ n: 1, state: 'active', upTo: true }] } }],
    },
  ],
  rulings: ['reading: the cost returns DON!! to the deck first; "up to 1" asks a count'],
};
