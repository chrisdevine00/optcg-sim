import type { CardScript } from '../../src/dsl.ts';

/** OP13-056 LittleOars Jr.. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_056: CardScript = {
  cardId: 'OP13-056',
  textHash: '0e40694a73d2cd',
  verified: {
    source: 'cards/overrides/OP13-056.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'attack',
      label: 'If your Leader\'s type includes "Whitebeard Pirates", draw 1 card',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        { if: { leader: { typeIncludes: 'Whitebeard Pirates' } }, then: [{ do: { draw: 1 } }] },
      ],
    },
  ],
};
