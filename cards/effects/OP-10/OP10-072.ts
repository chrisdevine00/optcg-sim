import type { CardScript } from '../../src/dsl.ts';

/** OP10-072 Donquixote Rosinante. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_072: CardScript = {
  cardId: 'OP10-072',
  textHash: '187e3a8efa99bd',
  verified: {
    source: 'cards/overrides/OP10-072.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'You may trash 1 Event from your hand: draw 2 cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              category: ['Event'],
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 2,
          },
        },
      ],
    },
    {
      id: 'end-turn',
      label:
        'End of your turn: if you have 7 or more DON!! cards on your field, set up to 2 of your DON!! cards as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'you',
              },
              '>=',
              7,
            ],
          },
          then: [
            {
              do: {
                setActive: {
                  from: 'donCostArea',
                  owner: 'you',
                  pick: {
                    upTo: 2,
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
    'reading: DON!! on your field is the cost area plus the DON!! given to cards; "set up to 2 ... as active" asks a count',
  ],
};
