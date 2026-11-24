import type { CardScript } from '../../src/dsl.ts';

/** OP11-004 Kujyaku. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_004: CardScript = {
  cardId: 'OP11-004',
  textHash: '031c41958abced',
  verified: {
    source: 'cards/overrides/OP11-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 {Navy} card other than [Kujyaku] and add it to your hand; the rest to the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    all: [
                      {
                        type: 'Navy',
                      },
                      {
                        not: {
                          name: 'Kujyaku',
                        },
                      },
                    ],
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
      id: 'trash-boost',
      label: 'You may trash this Character: up to 1 of your Characters gains +1000 power this turn',
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
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the +1000 target is chosen after Kujyaku is trashed (cost), so it cannot target itself',
  ],
};
