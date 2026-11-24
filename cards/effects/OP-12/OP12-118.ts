import type { CardScript } from '../../src/dsl.ts';

/** OP12-118 Jewelry Bonney. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_118: CardScript = {
  cardId: 'OP12-118',
  textHash: '1e72c32959d59f',
  verified: {
    source: 'cards/overrides/OP12-118.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'With 8+ rested cards: draw 2, trash 1 from your hand, then set up to 1 DON!! as active',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                sum: [
                  {
                    count: {
                      from: 'field',
                      owner: 'you',
                      filter: {
                        state: 'rested',
                      },
                    },
                  },
                  {
                    donOnField: 'you',
                    state: 'rested',
                  },
                ],
              },
              '>=',
              8,
            ],
          },
          then: [
            {
              do: {
                draw: 2,
              },
            },
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'you',
                  pick: {
                    exactly: 1,
                  },
                },
              },
            },
            {
              do: {
                setActive: {
                  from: 'donCostArea',
                  owner: 'you',
                  pick: {
                    upTo: 1,
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
    'M6b-Q25: "rested cards" = rested Leader, Characters and Stage plus rested DON!! in the cost area (the audit reading); this card itself, just played active, is not counted. "Then, set up to 1 DON!!" is inside the guard (M4b-5)',
  ],
};
