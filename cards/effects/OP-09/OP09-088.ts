import type { CardScript } from '../../src/dsl.ts';

/** OP09-088 Shiryu. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_088: CardScript = {
  cardId: 'OP09-088',
  textHash: '086ab3edeb4393',
  verified: {
    source: 'cards/overrides/OP09-088.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          donGiven: 1,
        },
      ],
      label: '[DON!! x1] You may trash 2 cards from your hand: draw 2 cards',
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 2,
          },
        },
      ],
    },
  ],
};
