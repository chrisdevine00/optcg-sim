import type { CardScript } from '../../src/dsl.ts';

/** OP15-053 Rebecca. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_053: CardScript = {
  cardId: 'OP15-053',
  textHash: '0ec6abea0f7edb',
  verified: {
    source: 'cards/overrides/OP15-053.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label: '[DON!! x1] This Character gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          donGiven: 1,
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Blocker',
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'Look at 3; reveal up to 1 {Dressrosa} card to your hand; the rest to the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    type: 'Dressrosa',
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
  ],
};
