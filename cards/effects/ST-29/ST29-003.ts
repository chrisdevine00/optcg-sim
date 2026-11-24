import type { CardScript } from '../../src/dsl.ts';

/** ST29-003 Kaku. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST29_003: CardScript = {
  cardId: 'ST29-003',
  textHash: '03cfae04ffb24c',
  verified: {
    source: 'cards/overrides/ST29-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'boost',
      label:
        'If you have as few Life cards as your opponent or fewer, this Character gains +1000 power',
      kind: 'permanent',
      conditions: [{ cmp: [{ life: 'you' }, '<=', { life: 'opponent' }] }],
      apply: [{ power: { target: { from: 'self', owner: 'you' }, amount: 1000 } }],
    },
    {
      id: 'trigger',
      label: "K.O. up to 1 of your opponent's Characters with a cost of 3 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 3 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: ['reading: "equal to or less than" is <= (equal Life counts, including 0 and 0)'],
};
