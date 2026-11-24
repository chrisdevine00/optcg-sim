import type { CardScript } from '../../src/dsl.ts';

/** ST06-008 Hina. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST06_008: CardScript = {
  cardId: 'ST06-008',
  textHash: '19e35c363389a8',
  verified: {
    source: 'cards/overrides/ST06-008.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Give up to 1 of your opponent's Characters -4 cost during this turn",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            cost: {
              target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
              amount: -4,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
