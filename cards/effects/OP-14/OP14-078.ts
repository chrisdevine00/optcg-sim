import type { CardScript } from '../../src/dsl.ts';

/** OP14-078 Bullet String. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_078: CardScript = {
  cardId: 'OP14-078',
  textHash: '1ed3fca46f877c',
  verified: {
    source: 'cards/overrides/OP14-078.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'DON!! -1: if your Leader has {Donquixote Pirates}, up to 1 Leader or Character +2000 during this battle and an additional +2000 during this turn',
      kind: 'activate',
      when: 'counter',
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Donquixote Pirates',
            },
          },
          then: [
            {
              do: {
                select: {
                  from: ['leader', 'characters'],
                  owner: 'you',
                  pick: {
                    upTo: 1,
                  },
                  bind: 'target',
                },
              },
            },
            {
              do: {
                power: {
                  target: {
                    from: ['leader', 'characters'],
                    owner: 'you',
                    filter: {
                      ref: 'target',
                    },
                  },
                  amount: 2000,
                  duration: 'battle',
                },
              },
            },
            {
              do: {
                power: {
                  target: {
                    from: ['leader', 'characters'],
                    owner: 'you',
                    filter: {
                      ref: 'target',
                    },
                  },
                  amount: 2000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the DON!! -1 is the DON!! -X cost of the engine, which is always optional (RL-52: its reminder text says "You may return"), so declining it skips the effect; the "Then, that card gains an additional +2000" is inside the "If" like the first clause',
  ],
};
