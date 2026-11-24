import type { CardScript } from '../../src/dsl.ts';

/** EB05-050 Atlas. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_050: CardScript = {
  cardId: 'EB05-050',
  textHash: '0dcd3f6cca6959',
  verified: {
    source: 'cards/overrides/EB05-050.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 4; reveal up to 1 card with the "Wisdom" attribute and add it to your hand; rest at the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 4,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    attribute: 'Wisdom',
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
    {
      id: 'trigger',
      label: "Activate this card's [On Play] effect",
      kind: 'trigger',
      effect: [
        {
          do: {
            activate: {
              ability: 'onPlay',
              of: 'self',
            },
          },
        },
      ],
    },
  ],
};
