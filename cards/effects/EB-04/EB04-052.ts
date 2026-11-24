import type { CardScript } from '../../src/dsl.ts';

/** EB04-052 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_052: CardScript = {
  cardId: 'EB04-052',
  textHash: '03fd28343189ce',
  verified: {
    source: 'cards/overrides/EB04-052.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'attack',
      label: "Base power becomes the same as your opponent's Leader during this turn",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            select: {
              from: 'leader',
              owner: 'opponent',
              bind: 'l',
            },
          },
        },
        {
          do: {
            setBasePower: {
              target: {
                from: 'self',
                owner: 'you',
              },
              value: {
                refStat: 'l',
                stat: 'basePower',
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label:
        'With 2 or less Life, play up to 1 yellow Character with 6000 power or less from your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'you',
              },
              '<=',
              2,
            ],
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      all: [
                        {
                          category: ['Character'],
                        },
                        {
                          color: 'Yellow',
                        },
                        {
                          power: {
                            lte: 6000,
                          },
                        },
                      ],
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
