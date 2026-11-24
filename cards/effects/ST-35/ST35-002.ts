import type { CardScript } from '../../src/dsl.ts';

/** ST35-002 Lindbergh. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST35_002: CardScript = {
  cardId: 'ST35-002',
  textHash: '10a465ed02f9d8',
  verified: {
    source: 'cards/overrides/ST35-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Give up to 1 of your opponent's Characters -3000 power during this turn",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            power: {
              target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
              amount: -3000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
