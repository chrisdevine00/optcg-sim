import type { CardScript } from '../../src/dsl.ts';

/** OP18-116 Iron Body Empty Tree. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_116: CardScript = {
  cardId: 'OP18-116',
  textHash: '06268dccd80698',
  verified: {
    source: 'cards/overrides/OP18-116.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },

  abilities: [
    {
      id: 'counter',
      label:
        'You may trash 1 card from your hand: up to 1 of your Leader or Characters gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      costOptional: true,
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
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
      label: 'If your Leader\'s type includes "CP", rest up to 1 of your opponent\'s Characters',
      kind: 'trigger',
      effect: [
        {
          if: { leader: { typeIncludes: 'CP' } },
          then: [{ do: { rest: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } } }],
        },
      ],
    },
  ],
};
