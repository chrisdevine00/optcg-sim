import type { CardScript } from '../../src/dsl.ts';

/** OP13-082 Five Elders. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_082: CardScript = {
  cardId: 'OP13-082',
  textHash: '097bea2ee57735',
  verified: {
    source: 'cards/overrides/OP13-082.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'With an [Imu] Leader, rest 1 DON!! and trash 1 card from your hand: trash all your Characters and play up to 5 "Five Elders" Characters with 5000 power and different names from your trash',
      kind: 'activate',
      when: 'activateMain',
      conditions: [
        {
          leader: {
            name: 'Imu',
          },
        },
      ],
      cost: [
        {
          restDon: 1,
        },
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
            move: {
              what: {
                from: 'characters',
                owner: 'you',
              },
              to: {
                zone: 'trash',
              },
            },
          },
        },
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Five Elders',
                    },
                    {
                      power: {
                        eq: 5000,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 5,
                  distinctNames: true,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the leading "If your Leader is [Imu]" before the colon is an activation condition (not offered otherwise; the costs are not paid); "trash all of your Characters" includes Five Elders itself (12000 power, so it cannot come back); the Characters just trashed are candidates for the play (those with 5000 power); "different card names" is a distinct-names pick (the first of two copies chosen blocks the second); "5000 power" is the printed power in the trash',
  ],
};
