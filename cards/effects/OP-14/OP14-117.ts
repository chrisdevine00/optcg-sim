import type { CardScript } from '../../src/dsl.ts';

/** OP14-117 Brick Bat. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_117: CardScript = {
  cardId: 'OP14-117',
  textHash: '1f706ec2d5f545',
  verified: {
    source: 'cards/overrides/OP14-117.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Up to 1 of your {Thriller Bark Pirates} Leader or Characters gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { type: 'Thriller Bark Pirates' },
                pick: { upTo: 1 },
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        'Play up to 1 {Thriller Bark Pirates} Character with a cost of 4 or less from your trash rested',
      kind: 'trigger',
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { type: 'Thriller Bark Pirates' },
                    { cost: { lte: 4 } },
                  ],
                },
                pick: { upTo: 1 },
              },
              rested: true,
            },
          },
        },
      ],
    },
  ],
};
