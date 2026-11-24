import type { CardScript } from '../../src/dsl.ts';

/** OP15-084 Dr. Hogback. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_084: CardScript = {
  cardId: 'OP15-084',
  textHash: '0939290d16d3e3',
  verified: {
    source: 'cards/overrides/OP15-084.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has the {Thriller Bark Pirates} type, trash 5 cards from the top of your deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { type: 'Thriller Bark Pirates' } },
          then: [{ do: { mill: { player: 'you', n: 5 } } }],
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'If you have 6 or less cards in your hand, draw 1 card',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          if: { cmp: [{ hand: 'you' }, '<=', 6] },
          then: [{ do: { draw: 1 } }],
        },
      ],
    },
  ],
};
