import type { CardScript } from '../../src/dsl.ts';

/** ST29-009 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST29_009: CardScript = {
  cardId: 'ST29-009',
  textHash: '0f63e6eef514cf',
  verified: {
    source: 'cards/overrides/ST29-009.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
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
