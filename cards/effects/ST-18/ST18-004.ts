import type { CardScript } from '../../src/dsl.ts';

/** ST18-004 Zoro-Juurou. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST18_004: CardScript = {
  cardId: 'ST18-004',
  textHash: '0a57c9f30e2e43',
  verified: {
    source: 'cards/overrides/ST18-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 purple {Straw Hat Crew} card and add it to your hand; the rest to the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: { upTo: 1 },
                  filter: { all: [{ color: 'Purple' }, { type: 'Straw Hat Crew' }] },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "purple {Straw Hat Crew} type card" names no category, so an Event or Stage of that color and type is also takeable; a multicolor card containing purple counts as purple',
  ],
};
