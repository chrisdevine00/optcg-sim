import type { CardScript } from '../../src/dsl.ts';

/** OP15-040 Viola. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_040: CardScript = {
  cardId: 'OP15-040',
  textHash: '171a18d4ecf68d',
  verified: {
    source: 'cards/overrides/OP15-040.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 3 cards; reveal up to 1 Dressrosa card and add it to your hand; the rest to the bottom',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [
                { pick: { upTo: 1 }, filter: { type: 'Dressrosa' }, reveal: true, to: 'hand' },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
};
