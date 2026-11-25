import type { CardScript } from '../../src/dsl.ts';

/** ST23-002 Shanks. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST23_002: CardScript = {
  cardId: 'ST23-002',
  textHash: '195ed9a70f8ea9',
  verified: {
    source: 'cards/overrides/ST23-002.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'cheaper',
      label: 'In hand: -3 cost while your opponent has a Character with 8000 base power or more',
      kind: 'permanent',
      zone: 'hand',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'opponent',
            filter: {
              basePower: {
                gte: 8000,
              },
            },
          },
        },
      ],
      apply: [
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: -3,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'If your Leader has the "Red-Haired Pirates" type or is [Uta], your Leader gains +2000 power until the end of your opponent\'s next End Phase',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            any: [
              {
                leader: {
                  type: 'Red-Haired Pirates',
                },
              },
              {
                leader: {
                  name: 'Uta',
                },
              },
            ],
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: 'leader',
                    owner: 'you',
                  },
                  amount: 2000,
                  duration: 'untilEndOfOpponentsNextTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the printed "\\"Red-Haired Pirates\\" type" is an exact type element (not a substring); "is [Uta]" is the Leader\'s name',
    'reading: the discount reads base power (printed, DON!! and buffs ignored), opposing Characters only',
  ],
};
