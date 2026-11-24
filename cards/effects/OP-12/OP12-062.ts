import type { CardScript } from '../../src/dsl.ts';

/** OP12-062 Vinsmoke Sora. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_062: CardScript = {
  cardId: 'OP12-062',
  textHash: '0c9874dd9e25ef',
  verified: {
    source: 'cards/overrides/OP12-062.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader is [Sanji] and you have no more DON!! than your opponent: add up to 1 DON!! and rest it; then draw 1 card',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            all: [
              { leader: { name: 'Sanji' } },
              { cmp: [{ donOnField: 'you' }, '<=', { donOnField: 'opponent' }] },
            ],
          },
          then: [{ do: { addDon: [{ n: 1, state: 'rested', upTo: true }] } }, { do: { draw: 1 } }],
        },
      ],
    },
  ],
  rulings: [
    'Reading (M4b-5, RD 121-122): "Then, draw 1" sits inside the "If" and does not resolve when the condition fails; it is "Then", not "If you do", so declining the DON!! (up to 1) still draws; the DON!! count is the whole field (cost area plus given)',
  ],
};
