import type { CardScript } from '../../src/dsl.ts';

/** OP11-037 Ancient Weapon Poseidon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_037: CardScript = {
  cardId: 'OP11-037',
  textHash: '0274a2e1dfe415',
  verified: {
    source: 'cards/overrides/OP11-037.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Look at 4; reveal up to 1 {Neptunian} or {Fish-Man Island} Character card and add it to your hand; rest to the bottom',
      kind: 'activate',
      when: 'main',
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
                    all: [
                      {
                        category: ['Character'],
                      },
                      {
                        any: [
                          {
                            type: 'Neptunian',
                          },
                          {
                            type: 'Fish-Man Island',
                          },
                        ],
                      },
                    ],
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
      label: 'Draw 1 card',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the quoted "Neptunian" / "Fish-Man Island" types are the exact types (effect-dsl 1.5); CR 8-4-4-2: a search may take nothing',
  ],
};
