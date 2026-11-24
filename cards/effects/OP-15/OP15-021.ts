import type { CardScript } from '../../src/dsl.ts';

/** OP15-021 Just Watch Me, Ace!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_021: CardScript = {
  cardId: 'OP15-021',
  textHash: '072035a64ca66e',
  verified: {
    source: 'cards/overrides/OP15-021.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cheaper',
      label: 'In hand: -3 cost if you have 4 or more Events in your trash',
      kind: 'permanent',
      zone: 'hand',
      conditions: [
        {
          cmp: [
            { count: { from: 'trash', owner: 'you', filter: { category: ['Event'] } } },
            '>=',
            4,
          ],
        },
      ],
      apply: [{ cost: { target: { from: 'self', owner: 'you' }, amount: -3 } }],
    },
    {
      id: 'main',
      label: "Give up to 1 of your opponent's Characters -3000 power",
      kind: 'activate',
      when: ['main', 'counter'],
      effect: [
        {
          do: {
            power: {
              target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
              amount: -3000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
