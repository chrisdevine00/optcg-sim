import type { CardScript } from '../../src/dsl.ts';

/** OP11-006 Zephyr. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_006: CardScript = {
  cardId: 'OP11-006',
  textHash: '032ff43f491712',
  verified: {
    source: 'cards/overrides/OP11-006.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        "[DON!! x1] [When Attacking] Give up to 1 of your opponent's <Special> attribute Characters -5000 power during this turn",
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [{ donGiven: 1 }],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: { attribute: 'Special' },
                pick: { upTo: 1 },
              },
              amount: -5000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the sign is -5000 (fixed in the override); <Special> is the printed attribute; only an opponent Character qualifies; "up to 1" may be declined, and with no <Special> Character the pick is asked at max 0',
  ],
};
