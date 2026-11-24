import type { CardScript } from '../../src/dsl.ts';

/** OP13-043 Otama. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_043: CardScript = {
  cardId: 'OP13-043',
  textHash: '0b5546878baf4e',
  verified: {
    source: 'cards/overrides/OP13-043.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If you have 3 or less Life cards, draw 2 cards and trash 1 card from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { cmp: [{ life: 'you' }, '<=', 3] },
          then: [
            { do: { draw: 2 } },
            { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } },
          ],
        },
      ],
    },
  ],
};
