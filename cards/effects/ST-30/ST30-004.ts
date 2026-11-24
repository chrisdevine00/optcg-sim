import type { CardScript } from '../../src/dsl.ts';

/** ST30-004 Emporio.Ivankov. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST30_004: CardScript = {
  cardId: 'ST30-004',
  textHash: '0da37686cbf57e',
  verified: {
    source: 'cards/overrides/ST30-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'You may reveal 2 Character cards with 6000 power from your hand: draw 3 and trash 2',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              all: [
                {
                  category: ['Character'],
                },
                {
                  power: {
                    eq: 6000,
                  },
                },
              ],
            },
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 3,
          },
        },
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'you',
              pick: {
                exactly: 2,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the revealed cards stay in hand and may be trashed by the effect; "Draw 3 and trash 2" is a sequence',
  ],
};
