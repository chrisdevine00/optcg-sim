import type { CardScript } from '../../src/dsl.ts';

/** OP14-097 Hurry Up and Make Me the Pirate King!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_097: CardScript = {
  cardId: 'OP14-097',
  textHash: '0272accae34f46',
  verified: {
    source: 'cards/overrides/OP14-097.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Look at 3, reveal up to 1 {Thriller Bark Pirates} card other than this one to hand, trash the rest',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [
                {
                  pick: { upTo: 1 },
                  filter: {
                    all: [
                      { type: 'Thriller Bark Pirates' },
                      { not: { name: 'Hurry Up and Make Me the Pirate King!' } },
                    ],
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'trash',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Activate this card's [Main] effect",
      kind: 'trigger',
      effect: [{ do: { activate: { ability: 'main', of: 'self' } } }],
    },
  ],
};
