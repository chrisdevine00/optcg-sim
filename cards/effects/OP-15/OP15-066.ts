import type { CardScript } from '../../src/dsl.ts';

/** OP15-066 Satori. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_066: CardScript = {
  cardId: 'OP15-066',
  textHash: '028d9f93ff3fdc',
  verified: {
    source: 'cards/overrides/OP15-066.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
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
    {
      id: 'when-attacking',
      label: 'With 6 or less DON!!, look at 2 and place them on the top or bottom in any order',
      kind: 'auto',
      when: ['whenAttacking'],
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
      effect: [
        {
          do: {
            lookAtTop: {
              n: 2,
              take: [],
              rest: 'topOrBottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'same reading as OP17-050 Streusen: both cards go to the top or both to the bottom (QA-OP17 OP17-050)',
  ],
};
