import type { CardScript } from '../../src/dsl.ts';

/** OP15-076 Lightning Beast Kiten. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_076: CardScript = {
  cardId: 'OP15-076',
  textHash: '17267fae538279',
  verified: {
    source: 'cards/overrides/OP15-076.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label:
        "DON!! -1: with an [Enel] Leader draw 1, then give up to 1 of your opponent's Characters -1000 power",
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
                power: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: -1000,
                  duration: 'thisTurn',
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
  rulings: ['reading: the power reduction after "Then" needs the [Enel] Leader (CR 4-10-1)'],
};
