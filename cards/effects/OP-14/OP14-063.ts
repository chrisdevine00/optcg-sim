import type { CardScript } from '../../src/dsl.ts';

/** OP14-063 Sugar. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_063: CardScript = {
  cardId: 'OP14-063',
  textHash: '18c45201ee2926',
  verified: {
    source: 'cards/overrides/OP14-063.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Add up to 1 DON!! and set it as active',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'active',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label:
        'If your opponent has 6 or more DON!!, play up to 1 {Donquixote Pirates} Character with a cost of 5 or less from your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'opponent',
              },
              '>=',
              6,
            ],
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
                          type: 'Donquixote Pirates',
                        },
                        {
                          cost: {
                            lte: 5,
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
  rulings: [
    'reading: "DON!! cards on their field" counts the opponent\'s cost area and the DON!! given to their cards (rules-digest); the hand is never filtered by a condition, so the pick is asked at max 0 when nothing matches',
  ],
};
