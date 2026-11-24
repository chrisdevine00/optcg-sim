import type { CardScript } from '../../src/dsl.ts';

/** OP03-072 Gum-Gum Jet Gatling. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP03_072: CardScript = {
  cardId: 'OP03-072',
  textHash: '1028b7c3c10534',
  verified: {
    source: 'cards/overrides/OP03-072.json (card text in cards/data)',
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
      label: 'Add up to 1 DON!! card from your DON!! deck and set it as active',
      kind: 'trigger',
      effect: [{ do: { addDon: [{ n: 1, state: 'active', upTo: true }] } }],
    },
  ],
};
