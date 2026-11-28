import type { CardScript } from '../../src/dsl.ts';

/** OP18-096 I'll Make the Call. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_096: CardScript = {
  cardId: 'OP18-096',
  textHash: '0ce1fc566c3a4e',
  verified: {
    source: 'cards/overrides/OP18-096.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },

  abilities: [
    {
      id: 'main',
      label:
        'You may rest 3 of your DON!! cards: play up to 1 {Holy Knights of God} type Character card with a cost of 6 or less from your trash',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [{ restDon: 3 }],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { type: 'Holy Knights of God' },
                    { cost: { lte: 6 } },
                  ],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label:
        'If you have 10 or more cards in your trash, up to 1 of your Leader or Characters gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          if: { cmp: [{ trash: 'you' }, '>=', 10] },
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
  ],
};
