import type { CardScript } from '../../src/dsl.ts';

/** OP15-063 Gedatsu. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_063: CardScript = {
  cardId: 'OP15-063',
  textHash: '0f3db98aef3cde',
  verified: {
    source: 'cards/overrides/OP15-063.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'DON!! -1: draw 1 card',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label:
        "With 6 or less DON!!, K.O. up to 1 of your opponent's Characters with 2000 power or less",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'you',
              },
              '<=',
              6,
            ],
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    power: {
                      lte: 2000,
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
};
