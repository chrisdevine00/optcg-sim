import type { CardScript } from '../../src/dsl.ts';

/** OP10-117 ROOM. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_117: CardScript = {
  cardId: 'OP10-117',
  textHash: '0706cefde3d82a',
  verified: {
    source: 'cards/overrides/OP10-117.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'If you have 1 or less Life cards, up to 1 of your Leader or Character cards gains +3000 power during this battle; then set up to 1 of your Characters with a cost of 5 or less as active',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'you',
              },
              '<=',
              1,
            ],
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: ['leader', 'characters'],
                    owner: 'you',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: 3000,
                  duration: 'battle',
                },
              },
            },
            {
              do: {
                setActive: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    cost: {
                      lte: 5,
                    },
                  },
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
    'reading: "Then" is not "If you do" and a "Then" after a failed "If" does not resolve (M4b-5): with 2+ Life neither the +3000 nor the set-active happens',
  ],
};
