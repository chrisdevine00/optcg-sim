import type { CardScript } from '../../src/dsl.ts';

/** EB05-048 Hedgehog Stinger. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_048: CardScript = {
  cardId: 'EB05-048',
  textHash: '0447ea53b9fc8e',
  verified: {
    source: 'cards/overrides/EB05-048.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Rest 1 DON!! and K.O. 1 of your {Baroque Works} Characters: your opponent's cost 0 Characters cannot activate [Blocker] this turn",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          restDon: 1,
        },
        {
          ko: {
            from: 'characters',
            owner: 'you',
            filter: {
              typeIncludes: 'Baroque Works',
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
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  cost: {
                    eq: 0,
                  },
                },
              },
              what: 'cannotActivateBlocker',
              duration: 'thisTurn',
            },
          },
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
    'Wave 1 reading 6 (G10): the cost 0 Characters are fixed when the effect resolves; a Character that reaches cost 0 later this turn can still block',
    'RL-16: a K.O. cost is a K.O.; [On K.O.] fires and K.O. protection stops it',
  ],
};
