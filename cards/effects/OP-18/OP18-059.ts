import type { CardScript } from '../../src/dsl.ts';

/** OP18-059 I Pray For Your Success.. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_059: CardScript = {
  cardId: 'OP18-059',
  textHash: '1f2feebc036751',
  verified: {
    source: 'cards/overrides/OP18-059.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may rest 1 of your DON!! cards and trash 1 card with a type including "Baroque Works" from your hand: draw 2 cards',
      kind: 'activate',
      when: 'main',
      cost: [
        {
          restDon: 1,
        },
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              typeIncludes: 'Baroque Works',
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      costOptional: true,
      effect: [
        {
          do: {
            draw: 2,
          },
        },
      ],
    },
    {
      id: 'counter',
      label:
        'You may trash 1 card from your hand: up to 1 of your Leader or Characters gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      costOptional: true,
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: both costs are optional; the [Main] cost is two parts paid together (rest 1 DON!! and trash 1 Baroque Works card), declining gives no draw',
  ],
};
