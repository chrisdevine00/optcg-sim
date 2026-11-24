import type { CardScript } from '../../src/dsl.ts';

/** ST30-008 Marco. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST30_008: CardScript = {
  cardId: 'ST30-008',
  textHash: '140f57f537482d',
  verified: {
    source: 'cards/overrides/ST30-008.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-ko',
      label:
        'You may trash 1 Character card with 6000 power from your hand: play this Character from your trash rested',
      kind: 'auto',
      when: ['onKO'],
      cost: [
        {
          trash: {
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
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'self',
                owner: 'you',
              },
              rested: true,
            },
          },
        },
      ],
    },
  ],
};
