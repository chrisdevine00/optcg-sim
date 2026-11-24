import type { CardScript } from '../../src/dsl.ts';

/** EB03-035 Charlotte Pudding. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_035: CardScript = {
  cardId: 'EB03-035',
  textHash: '155ffeccf91497',
  verified: {
    source: 'cards/overrides/EB03-035.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'If you have as few DON!! as your opponent or fewer, add up to 1 DON!! and rest it',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { cmp: [{ donOnField: 'you' }, '<=', { donOnField: 'opponent' }] },
          then: [{ do: { addDon: [{ n: 1, state: 'rested', upTo: true }] } }],
        },
      ],
    },
  ],
};
