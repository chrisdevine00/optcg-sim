import type { CardScript } from '../../src/dsl.ts';

/** OP13-071 Nekomamushi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_071: CardScript = {
  cardId: 'OP13-071',
  textHash: '0268f2273e58de',
  verified: {
    source: 'cards/overrides/OP13-071.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'With 8 or more DON!! on your field: K.O. up to 1 opposing Character with 3000 base power or less',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'you',
              },
              '>=',
              8,
            ],
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    basePower: {
                      lte: 3000,
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
  ],
  rulings: [
    'reading: DON!! on your field include the cost area and DON!! given; base power, inclusive at 3000',
  ],
};
