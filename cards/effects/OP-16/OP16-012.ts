import type { CardScript } from '../../src/dsl.ts';

/** OP16-012 Benn.Beckman. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_012: CardScript = {
  cardId: 'OP16-012',
  textHash: '07ed1c01cda433',
  verified: {
    source: 'cards/overrides/OP16-012.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'You may rest 1 DON!!: if your Leader is {Red-Haired Pirates} and you have 10 DON!!, play up to 1 [Shanks] from your hand',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          restDon: 1,
        },
      ],
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  type: 'Red-Haired Pirates',
                },
              },
              {
                cmp: [
                  {
                    donOnField: 'you',
                  },
                  '>=',
                  10,
                ],
              },
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
                      name: 'Shanks',
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
