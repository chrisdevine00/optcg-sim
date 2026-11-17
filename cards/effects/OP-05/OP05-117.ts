import type { CardScript } from '../../src/dsl.ts';

/** OP05-117 Upper Yard. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP05_117: CardScript = {
  cardId: 'OP05-117',
  textHash: '04c23c0fbe2dee',
  verified: {
    source: 'cards/overrides/OP05-117.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 5, add up to 1 {Sky Island} to your hand, rest to the bottom',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
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
  rulings: [
    'The printed [Sky Island] in brackets is the type, not a card name (no card is named Sky Island)',
  ],
};
