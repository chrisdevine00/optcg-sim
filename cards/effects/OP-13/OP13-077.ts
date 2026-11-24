import type { CardScript } from '../../src/dsl.ts';

/** OP13-077 Go All the Way to the Top!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_077: CardScript = {
  cardId: 'OP13-077',
  textHash: '0b9f03e284e43f',
  verified: {
    source: 'cards/overrides/OP13-077.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may rest 3 DON!!: with any DON!! given, K.O. up to 1 opposing Character with 4000 base power or less and up to 1 with 3000 base power or less',
      kind: 'activate',
      when: 'main',
      cost: [
        {
          restDon: 3,
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
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    basePower: {
                      lte: 4000,
                    },
                  },
                  pick: {
                    upTo: 1,
                  },
                },
              },
            },
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    basePower: {
                      lte: 3000,
                    },
                  },
                  pick: {
                    upTo: 1,
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'counter',
      label: 'Your Leader gains +3000 power during this turn',
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
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b-Q6): "and" is two separate "up to 1" picks, the 4000-or-less pick first and the 3000-or-less pick second (a different Character: the first is already gone); a 3000 Character may fill either slot but not both, so choosing it first forfeits the second pick if no other 3000-or-less exists',
    'reading: the [Counter] is "during this turn" (not this battle): +3000 stays until the end of the turn',
  ],
};
