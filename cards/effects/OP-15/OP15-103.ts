import type { CardScript } from '../../src/dsl.ts';

/** OP15-103 Genbo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_103: CardScript = {
  cardId: 'OP15-103',
  textHash: '00c01bd08a07cf',
  verified: {
    source: 'cards/overrides/OP15-103.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trigger',
      label: 'Draw 1 card; then, if you have 2 or less Life cards, play this card',
      kind: 'trigger',
      effect: [
        { do: { draw: 1 } },
        {
          if: { cmp: [{ life: 'you' }, '<=', 2] },
          then: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
        },
      ],
    },
  ],
};
