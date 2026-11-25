import type { CardScript } from '../../src/dsl.ts';

/** PRB02-007 Jinbe. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB02_007: CardScript = {
  cardId: 'PRB02-007',
  textHash: '0e62e92e2b2217',
  verified: {
    source: 'cards/overrides/PRB02-007.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 {The Seven Warlords of the Sea} card other than [Jinbe] and add it to your hand; the rest to the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: { upTo: 1 },
                  filter: {
                    all: [{ type: 'The Seven Warlords of the Sea' }, { not: { name: 'Jinbe' } }],
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label: "Place up to 1 Character with a cost of 1 or less at the bottom of the owner's deck",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: { cost: { lte: 1 } },
                pick: { upTo: 1 },
              },
              to: { zone: 'deck', position: 'bottom' },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "a cost of 1 or less" is the current cost; the Character may be either side\'s, Jinbe included, and goes to its owner\'s deck',
  ],
};
