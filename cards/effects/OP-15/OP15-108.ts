import type { CardScript } from '../../src/dsl.ts';

/** OP15-108 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_108: CardScript = {
  cardId: 'OP15-108',
  textHash: '0f0389417da742',
  verified: {
    source: 'cards/overrides/OP15-108.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 3, add up to 1 {Sky Island} to your hand, rest to the bottom',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [
                { pick: { upTo: 1 }, filter: { type: 'Sky Island' }, reveal: true, to: 'hand' },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
};
