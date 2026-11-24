import type { CardScript } from '../../src/dsl.ts';

/** OP14-087 Miss.Valentine(Mikita). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_087: CardScript = {
  cardId: 'OP14-087',
  textHash: '16fbff48a7cd42',
  verified: {
    source: 'cards/overrides/OP14-087.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader is Baroque Works: look at 4, reveal up to 1 Baroque Works card other than [Miss.Valentine(Mikita)] to hand, trash the rest',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { typeIncludes: 'Baroque Works' } },
          then: [
            {
              do: {
                lookAtTop: {
                  n: 4,
                  take: [
                    {
                      pick: { upTo: 1 },
                      filter: {
                        all: [
                          { typeIncludes: 'Baroque Works' },
                          { not: { name: 'Miss.Valentine(Mikita)' } },
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
      ],
    },
  ],
};
