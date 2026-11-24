import type { CardScript } from '../../src/dsl.ts';

/** EB05-049 Special Hollow. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_049: CardScript = {
  cardId: 'EB05-049',
  textHash: '1af8d9f21224dd',
  verified: {
    source: 'cards/overrides/EB05-049.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "K.O. 1 of your {Thriller Bark Pirates} Characters: up to 1 of your opponent's Characters gets -3 cost this turn",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          ko: {
            from: 'characters',
            owner: 'you',
            filter: {
              type: 'Thriller Bark Pirates',
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            cost: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -3,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label:
        'K.O. 1 of your {Thriller Bark Pirates} Characters: up to 1 of your Leader or Characters gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      costOptional: true,
      cost: [
        {
          ko: {
            from: 'characters',
            owner: 'you',
            filter: {
              type: 'Thriller Bark Pirates',
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
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
              amount: 4000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "RL-16: a K.O. cost is a K.O.; a Character that cannot be K.O.'d by effects cannot pay it",
  ],
};
