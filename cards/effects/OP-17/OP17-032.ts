import type { CardScript } from '../../src/dsl.ts';

/** OP17-032 Limejuice. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_032: CardScript = {
  cardId: 'OP17-032',
  textHash: '186decca6a0d89',
  verified: {
    source: 'cards/overrides/OP17-032.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 3; reveal up to 1 card with a type including "Red-Haired Pirates" and add it to your hand',
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
                    typeIncludes: 'Red-Haired Pirates',
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
