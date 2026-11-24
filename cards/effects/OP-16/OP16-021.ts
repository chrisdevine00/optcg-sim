import type { CardScript } from '../../src/dsl.ts';

/** OP16-021 Moby Dick. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_021: CardScript = {
  cardId: 'OP16-021',
  textHash: '19281c449fbff5',
  verified: {
    source: 'cards/overrides/OP16-021.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader is {Whitebeard Pirates}: look at 3, add up to 1 to your hand, the rest to the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Whitebeard Pirates',
            },
          },
          then: [
            {
              do: {
                lookAtTop: {
                  n: 3,
                  take: [
                    {
                      pick: {
                        upTo: 1,
                      },
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
    },
    {
      id: 'give-don',
      label:
        'You may trash this Stage: give up to 1 rested DON!! to your Leader or 1 of your Characters',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
