import type { CardScript } from '../../src/dsl.ts';

/** ST34-003 Charlotte Brulee. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST34_003: CardScript = {
  cardId: 'ST34-003',
  textHash: '1706b84a589aab',
  verified: {
    source: 'cards/overrides/ST34-003.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 3; reveal up to 1 {Big Mom Pirates} card and add it to your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    type: 'Big Mom Pirates',
                  },
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
};
