import type { CardScript } from '../../src/dsl.ts';

/** OP16-111 Boa Sandersonia. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_111: CardScript = {
  cardId: 'OP16-111',
  textHash: '159b497e00faef',
  verified: {
    source: 'cards/overrides/OP16-111.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'trigger',
      label: 'If you have 2 or less Life, play this card',
      kind: 'trigger',
      effect: [
        {
          if: { cmp: [{ life: 'you' }, '<=', 2] },
          then: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
        },
      ],
    },
  ],
  rulings: [
    'reading: the Life count is read when the Trigger resolves, after the damage card was taken (2 or less includes that removal)',
  ],
};
