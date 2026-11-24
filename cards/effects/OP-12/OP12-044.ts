import type { CardScript } from '../../src/dsl.ts';

/** OP12-044 Sakazuki. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_044: CardScript = {
  cardId: 'OP12-044',
  textHash: '1a72f25ba511ec',
  verified: {
    source: 'cards/overrides/OP12-044.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If your Leader has the {Navy} type, draw 2 cards',
      kind: 'auto',
      when: ['onPlay'],
      effect: [{ if: { leader: { type: 'Navy' } }, then: [{ do: { draw: 2 } }] }],
    },
    {
      id: 'give-don',
      label:
        'You may trash 1 card from your hand: give up to 1 rested DON!! to your Leader or 1 of your Characters',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: { from: ['leader', 'characters'], owner: 'you', pick: { exactly: 1 } },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading: the rested DON!! give is as OP14-005 (n 1 asks no count; with a rested DON!! the give happens once the cost is paid); the hand trash is a cost, so the effect is not offered with an empty hand',
  ],
};
