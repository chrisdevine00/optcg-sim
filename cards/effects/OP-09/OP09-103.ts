import type { CardScript } from '../../src/dsl.ts';

/** OP09-103 Koala. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_103: CardScript = {
  cardId: 'OP09-103',
  textHash: '1be1300f96ddf8',
  verified: {
    source: 'cards/overrides/OP09-103.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label:
        'You may add 1 card from the top or bottom of your Life cards to your hand: play up to 1 {Revolutionary Army} Character with a cost of 4 or less from your hand; if you do, draw 1 card',
      cost: [
        {
          lifeToHand: {
            from: 'topOrBottom',
            n: 1,
          },
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Revolutionary Army',
                    },
                    {
                      cost: {
                        lte: 4,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
          label: 'played',
        },
        {
          ifDid: 'played',
          then: [
            {
              do: {
                draw: 1,
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "If you do" is the Character having been played (not the Life cost); no Character chosen means no draw; the played Character may itself be the card just added from Life',
  ],
};
