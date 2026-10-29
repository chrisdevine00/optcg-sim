import type { CardScript } from '../../src/dsl.ts';

/** OP17-050 Streusen. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_050: CardScript = {
  cardId: 'OP17-050',
  textHash: '1b27f731c234a8',
  verified: {
    source: 'cards/overrides/OP17-050.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 2, put them on top or bottom in any order, then draw 1',
      kind: 'auto',
      when: ['onPlay'],
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
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
  rulings: ['QA-OP17 OP17-050: both cards go to the top or both to the bottom'],
};
