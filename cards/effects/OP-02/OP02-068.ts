import type { CardScript } from '../../src/dsl.ts';

/** OP02-068 Gum-Gum Rain. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP02_068: CardScript = {
  cardId: 'OP02-068',
  textHash: '0c2cb953710813',
  verified: {
    source: 'cards/overrides/OP02-068.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'You may trash 1 card from your hand: up to 1 Leader or Character gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      costOptional: true,
      effect: [
        {
          do: {
            power: {
              target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Return up to 1 Character with a cost of 2 or less to the owner's hand",
      kind: 'trigger',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: { cost: { lte: 2 } },
                pick: { upTo: 1 },
              },
              to: { zone: 'hand' },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Character" with no owner qualifier is any Character on the field; the Counter cost is optional and declining it gives no power',
  ],
};
