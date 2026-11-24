import type { CardScript } from '../../src/dsl.ts';

/** EB04-006 Moda. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_006: CardScript = {
  cardId: 'EB04-006',
  textHash: '0f5a6fd9e24372',
  verified: {
    source: 'cards/overrides/EB04-006.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 7; reveal up to 1 [Lulucia Kingdom] and add it to your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 7,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    name: 'Lulucia Kingdom',
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
  rulings: [
    'reading: "[Lulucia Kingdom]" in square brackets is the card NAME (the Stage EB04-010), not the {Lulucia Kingdom} type; Moda and EB04-010 both carry the type but only the Stage has the name, so a Moda in the 7 is not offered; may take nothing',
  ],
};
