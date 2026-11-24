import type { CardScript } from '../../src/dsl.ts';

/** OP16-025 Bunkov. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_025: CardScript = {
  cardId: 'OP16-025',
  textHash: '0e01abf7ab9a98',
  verified: {
    source: 'cards/overrides/OP16-025.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        'If you have [Antlerkov], play up to 1 Character card with a cost of 2 or less from your hand',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'you',
              filter: {
                name: 'Antlerkov',
              },
            },
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      all: [
                        {
                          category: ['Character'],
                        },
                        {
                          cost: {
                            lte: 2,
                          },
                        },
                      ],
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
