import type { CardScript } from '../../src/dsl.ts';

/** OP15-038 It's an Order! Do Not Defy Me!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_038: CardScript = {
  cardId: 'OP15-038',
  textHash: '1226ff3af0ab37',
  verified: {
    source: 'cards/overrides/OP15-038.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Up to 1 of your opponent's rested Characters with a cost of 8 or less that has 2 or more DON!! cards given will not become active in your opponent's next Refresh Phase",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            skipRefresh: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                all: [{ state: 'rested' }, { cost: { lte: 8 } }, { donGiven: { gte: 2 } }],
              },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label: 'Up to 1 of your [Krieg] cards gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { name: 'Krieg' },
                pick: { upTo: 1 },
              },
              amount: 4000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "[Krieg] cards" in the Counter are your Leader and Characters named Krieg (a Leader or Character on the field is what can gain power); cost 8 or less is current cost',
  ],
};
