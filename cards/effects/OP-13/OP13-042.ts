import type { CardScript } from '../../src/dsl.ts';

/** OP13-042 Edward.Newgate. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_042: CardScript = {
  cardId: 'OP13-042',
  textHash: '0d1ba107541484',
  verified: {
    source: 'cards/overrides/OP13-042.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'Draw 2 cards and trash 1 card from your hand; then give your Leader and 1 Character up to 2 rested DON!! cards each',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        { do: { draw: 2 } },
        { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } },
        {
          do: {
            select: { from: 'characters', owner: 'you', pick: { exactly: 1 }, bind: 'chosen' },
          },
        },
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              each: true,
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { any: [{ category: ['Leader'] }, { ref: 'chosen' }] },
              },
            },
          },
        },
      ],
    },
  ],
};
