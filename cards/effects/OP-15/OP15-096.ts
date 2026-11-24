import type { CardScript } from '../../src/dsl.ts';

/** OP15-096 Swallow Bond en Avant. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_096: CardScript = {
  cardId: 'OP15-096',
  textHash: '0e5c8272ed0a24',
  verified: {
    source: 'cards/overrides/OP15-096.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may rest 1 of your DON!!: if your Leader has the {Straw Hat Crew} type, trash 5 cards from the top of your deck',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [{ restDon: 1 }],
      effect: [
        {
          if: { leader: { type: 'Straw Hat Crew' } },
          then: [{ do: { mill: { player: 'you', n: 5 } } }],
        },
      ],
    },
    {
      id: 'counter',
      label:
        'You may trash 1 card from your hand: up to 1 of your Leader or Character cards gains +3000 power during this battle',
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
  ],
};
