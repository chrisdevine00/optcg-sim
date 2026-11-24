import type { CardScript } from '../../src/dsl.ts';

/** EB05-030 Take Care, Everybody. ♡. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_030: CardScript = {
  cardId: 'EB05-030',
  textHash: '1afdcad64182a2',
  verified: {
    source: 'cards/overrides/EB05-030.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: 'If your Leader is [Nami], return up to 1 Character cost 5 or less to hand',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            leader: {
              name: 'Nami',
            },
          },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'characters',
                    owner: 'any',
                    filter: {
                      cost: {
                        lte: 5,
                      },
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                  to: {
                    zone: 'hand',
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
      label: 'Draw 1; up to 1 of your Leader or Characters gains +1000 power this turn',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
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
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: ['Reading: the [Counter] boost lasts "during this turn" as printed (not this battle)'],
};
