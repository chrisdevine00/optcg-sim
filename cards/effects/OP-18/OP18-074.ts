import type { CardScript } from '../../src/dsl.ts';

/** OP18-074 Can You Please Sail on the Ship I Made?!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_074: CardScript = {
  cardId: 'OP18-074',
  textHash: '0fe125470a59e6',
  verified: {
    source: 'cards/overrides/OP18-074.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'If you have a Stage with a cost of 5 or more, up to 1 of your Leader or Characters gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          if: { exists: { from: 'stage', owner: 'you', filter: { cost: { gte: 5 } } } },
          then: [
            {
              do: {
                power: {
                  target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
                  amount: 4000,
                  duration: 'battle',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'DON!! −1: add up to 2 Stage cards from your trash to your hand',
      kind: 'trigger',
      cost: [{ donMinus: 1 }],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: { category: ['Stage'] },
                pick: { upTo: 2 },
              },
              to: { zone: 'hand' },
            },
          },
        },
      ],
    },
  ],
};
