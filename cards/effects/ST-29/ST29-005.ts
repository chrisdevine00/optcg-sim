import type { CardScript } from '../../src/dsl.ts';

/** ST29-005 Jinbe. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST29_005: CardScript = {
  cardId: 'ST29-005',
  textHash: '074c2e869f3c43',
  verified: {
    source: 'cards/overrides/ST29-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trigger',
      label: 'If your Leader is [Monkey.D.Luffy], play this card',
      kind: 'trigger',
      effect: [
        {
          if: { leader: { name: 'Monkey.D.Luffy' } },
          then: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
        },
      ],
    },
  ],
};
