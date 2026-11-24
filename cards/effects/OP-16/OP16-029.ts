import type { CardScript } from '../../src/dsl.ts';

/** OP16-029 Antlerkov. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_029: CardScript = {
  cardId: 'OP16-029',
  textHash: '1585cf04dad5bb',
  verified: {
    source: 'cards/overrides/OP16-029.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        'If you have [Bunkov], play up to 1 Character card with a cost of 2 or less from your hand',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'you',
              filter: {
                name: 'Bunkov',
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
