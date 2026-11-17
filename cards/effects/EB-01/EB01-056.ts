import type { CardScript } from '../../src/dsl.ts';

/** EB01-056 Charlotte Flampe. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB01_056: CardScript = {
  cardId: 'EB01-056',
  textHash: '01a6c4abd217b9',
  verified: {
    source: 'cards/overrides/EB01-056.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Add 1 Life card to your hand: draw 1 card',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          lifeToHand: {
            from: 'topOrBottom',
            n: 1,
          },
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
