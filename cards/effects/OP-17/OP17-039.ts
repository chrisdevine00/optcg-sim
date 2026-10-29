import type { CardScript } from '../../src/dsl.ts';

/** OP17-039 Rocks.D.Xebec (Leader). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_039: CardScript = {
  cardId: 'OP17-039',
  textHash: '11eb6c5f98238f',
  verified: {
    source: 'cards/overrides/OP17-039.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'reveal-draw',
      label: 'Reveal your top card; draw 2 if its type includes "Rocks Pirates"',
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            reveal: {
              from: 'deckTop',
              n: 1,
              bind: 'revealed',
            },
          },
        },
        {
          if: {
            ref: 'revealed',
            matches: {
              typeIncludes: 'Rocks Pirates',
            },
          },
          then: [
            {
              do: {
                draw: 2,
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'RL-44',
    'QA-OP17 OP17-039: a hit draws the revealed card; a miss leaves it face-down on top',
  ],
};
