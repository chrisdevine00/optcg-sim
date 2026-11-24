import type { CardScript } from '../../src/dsl.ts';

/** EB05-004 Baby 5. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_004: CardScript = {
  cardId: 'EB05-004',
  textHash: '0ca7600536f954',
  verified: {
    source: 'cards/overrides/EB05-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'You may reveal 2 Event cards from your hand: draw 2 cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              category: ['Event'],
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
            draw: 2,
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'Play up to 1 Character card with 6000 power or less from your hand rested',
      kind: 'auto',
      when: ['onKO'],
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
                      power: {
                        lte: 6000,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              rested: true,
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "rested" means the Character enters the field rested (the `rested` flag on `play`)',
  ],
};
