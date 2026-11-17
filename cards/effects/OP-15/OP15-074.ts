import type { CardScript } from '../../src/dsl.ts';

/** OP15-074 Varie. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_074: CardScript = {
  cardId: 'OP15-074',
  textHash: '192797dc8aaeba',
  verified: {
    source: 'cards/overrides/OP15-074.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label:
        "DON!! -1: with an [Enel] Leader draw 1; then up to 1 of your Characters gains +2 cost until the end of your opponent's next End Phase",
      kind: 'activate',
      when: 'main',
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              name: 'Enel',
            },
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
            {
              do: {
                cost: {
                  target: {
                    from: 'characters',
                    owner: 'you',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: 2,
                  duration: 'untilEndOfOpponentsNextTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'counter',
      label: '[Counter] up to 1 of your [Enel] cards gains +2000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
                filter: {
                  name: 'Enel',
                },
              },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then, up to 1 of your Characters gains +2 cost" follows the "if", so it needs the [Enel] Leader too (CR 4-10-1); alternative: the cost boost is unconditional',
  ],
};
