import type { CardScript } from '../../src/dsl.ts';

/** OP16-076 The Three Admirals!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_076: CardScript = {
  cardId: 'OP16-076',
  textHash: '05b92a8658372f',
  verified: {
    source: 'cards/overrides/OP16-076.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: 'Rest 3 DON!!: up to 3 of your {Admiral} Characters gain +2000 power during this turn',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          restDon: 3,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  type: 'Admiral',
                },
                pick: {
                  upTo: 3,
                },
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label:
        'With an {Admiral} Character: up to 1 of your Leader or Character gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'you',
              filter: {
                type: 'Admiral',
              },
            },
          },
          then: [
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
    },
  ],
};
