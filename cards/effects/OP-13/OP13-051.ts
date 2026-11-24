import type { CardScript } from '../../src/dsl.ts';

/** OP13-051 Boa Hancock. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_051: CardScript = {
  cardId: 'OP13-051',
  textHash: '0c70046fe86af5',
  verified: {
    source: 'cards/overrides/OP13-051.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: 'If your Leader is [Boa Hancock] or multicolored, draw 2 cards',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          if: { leader: { any: [{ name: 'Boa Hancock' }, { multicolor: true }] } },
          then: [{ do: { draw: 2 } }],
        },
      ],
    },
  ],
};
