import type { CardScript } from '../../src/dsl.ts';

/** OP16-034 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_034: CardScript = {
  cardId: 'OP16-034',
  textHash: '19de3ff1c55682',
  verified: {
    source: 'cards/overrides/OP16-034.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'different-names',
      label:
        '[DON!! x1] [Your Turn] +1000 power for each of your Characters with a different card name',
      kind: 'permanent',
      conditions: [
        {
          yourTurn: true,
        },
        {
          donGiven: 1,
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: {
              mul: [
                {
                  count: {
                    from: 'characters',
                    owner: 'you',
                  },
                  distinctNames: true,
                },
                1000,
              ],
            },
          },
        },
      ],
    },
    {
      id: 'on-play',
      label: 'Look at 3; reveal up to 1 {Impel Down} card to your hand; the rest to the bottom',
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
                    type: 'Impel Down',
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
