import type { CardScript } from '../../src/dsl.ts';

/** EB02-032 Iceburg. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_032: CardScript = {
  cardId: 'EB02-032',
  textHash: '070458a4db7e14',
  verified: {
    source: 'cards/overrides/EB02-032.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'With 3 or more DON!!: look at 7, add up to 1 [Galley-La Company]; rest to the bottom; play up to 1 [Galley-La Company] from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'you',
              },
              '>=',
              3,
            ],
          },
          then: [
            {
              do: {
                lookAtTop: {
                  n: 7,
                  take: [
                    {
                      pick: {
                        upTo: 1,
                      },
                      filter: {
                        name: 'Galley-La Company',
                      },
                      reveal: true,
                      to: 'hand',
                    },
                  ],
                  rest: 'bottomAnyOrder',
                },
              },
            },
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      name: 'Galley-La Company',
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
  rulings: [
    'reading: as EB02-013; [Galley-La Company] is a card name (the Stage OP03-075), so the play is of that Stage; DON!! on the field counts the cost area plus given DON!!',
  ],
};
