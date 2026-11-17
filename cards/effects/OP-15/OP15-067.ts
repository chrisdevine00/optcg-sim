import type { CardScript } from '../../src/dsl.ts';

/** OP15-067 Shura. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_067: CardScript = {
  cardId: 'OP15-067',
  textHash: '0eb83d9b42cdd4',
  verified: {
    source: 'cards/overrides/OP15-067.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'rush',
      label: 'With 6 or less DON!! on your field, gains [Rush]',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              donOnField: 'you',
            },
            '<=',
            6,
          ],
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Rush',
          },
        },
      ],
    },
    {
      id: 'on-play',
      label: 'DON!! -1: draw 1',
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
  ],
};
