import type { CardScript } from '../../src/dsl.ts';

/** OP14-099 Disappointed?. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_099: CardScript = {
  cardId: 'OP14-099',
  textHash: '047330353f1e18',
  verified: {
    source: 'cards/overrides/OP14-099.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Look at 3, reveal up to 1 Baroque Works card other than this one to hand, trash the rest',
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
                    all: [{ typeIncludes: 'Baroque Works' }, { not: { name: 'Disappointed?' } }],
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
