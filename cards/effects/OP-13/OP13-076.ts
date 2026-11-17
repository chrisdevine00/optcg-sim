import type { CardScript } from '../../src/dsl.ts';

/** OP13-076 Divine Departure. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_076: CardScript = {
  cardId: 'OP13-076',
  textHash: '0b404179d2912a',
  verified: {
    source: 'cards/overrides/OP13-076.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may rest 5 DON!!: with any DON!! given, give up to 1 opposing Character -8000 power',
      kind: 'activate',
      when: 'main',
      cost: [
        {
          restDon: 5,
        },
      ],
      costOptional: true,
      effect: [
        {
          if: {
            cmp: [
              {
                donGiven: 'you',
              },
              '>=',
              1,
            ],
          },
          then: [
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
                  amount: -8000,
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
      label: 'You may trash 1 card from your hand: +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      cost: [
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
      costOptional: true,
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
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "any DON!! cards given" is checked after the rest cost is paid (the rested DON!! in the cost area are not given DON!!)',
  ],
};
