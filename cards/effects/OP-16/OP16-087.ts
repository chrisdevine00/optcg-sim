import type { CardScript } from '../../src/dsl.ts';

/** OP16-087 Shinobu. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_087: CardScript = {
  cardId: 'OP16-087',
  textHash: '010afae1f33114',
  verified: {
    source: 'cards/overrides/OP16-087.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Trash this Character: with a {Land of Wano} Leader draw 1 and up to 1 [Kouzuki Momonosuke] gains +20 cost during this turn',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Land of Wano',
            },
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
            {
              do: {
                cost: {
                  target: {
                    from: 'characters',
                    owner: 'you',
                    filter: {
                      name: 'Kouzuki Momonosuke',
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: 20,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
