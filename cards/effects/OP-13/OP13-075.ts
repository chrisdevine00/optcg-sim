import type { CardScript } from '../../src/dsl.ts';

/** OP13-075 Guess We'll Have Another Scrap. You Can Only Risk Death While You're Still Alive!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_075: CardScript = {
  cardId: 'OP13-075',
  textHash: '0b55e038f53f29',
  verified: {
    source: 'cards/overrides/OP13-075.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may rest 1 of your DON!!: with a [Gol.D.Roger] Leader and any DON!! given, add up to 1 DON!! rested',
      kind: 'activate',
      when: 'main',
      cost: [
        {
          restDon: 1,
        },
      ],
      costOptional: true,
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  name: 'Gol.D.Roger',
                },
              },
              {
                cmp: [
                  {
                    donGiven: 'you',
                  },
                  '>=',
                  1,
                ],
              },
            ],
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 1,
                    state: 'rested',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      id: 'counter',
      label: 'Your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
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
    'reading: the conditions follow the colon, so the DON!! is rested even when they fail; "any DON!! cards given" is checked after the cost is paid (the rested DON!! is not given); [Counter] has no condition and no cost',
  ],
};
