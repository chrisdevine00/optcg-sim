import type { CardScript } from '../../src/dsl.ts';

/** EB04-013 Carrot. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_013: CardScript = {
  cardId: 'EB04-013',
  textHash: '08708c73ad2831',
  verified: {
    source: 'cards/overrides/EB04-013.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If your Leader has {Minks}, set up to 2 {Minks} Characters and your Leader as active',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Minks',
            },
          },
          then: [
            {
              do: {
                setActive: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    type: 'Minks',
                  },
                  pick: {
                    upTo: 2,
                  },
                },
              },
            },
            {
              do: {
                setActive: {
                  from: 'leader',
                  owner: 'you',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "up to 2 of your {Minks} Characters and your Leader" is two groups: up to 2 {Minks} Characters (this one included, if rested by a cost) and the Leader, which is not an "up to" choice (it is never worse); the Leader\'s type is checked as the effect resolves',
  ],
};
