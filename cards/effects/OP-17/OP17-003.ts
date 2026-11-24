import type { CardScript } from '../../src/dsl.ts';

/** OP17-003 Izo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_003: CardScript = {
  cardId: 'OP17-003',
  textHash: '09cb7a2dfbced1',
  verified: {
    source: 'cards/overrides/OP17-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Rush: Character'],
  abilities: [
    {
      id: 'on-play',
      label:
        "If your Leader is [Edward.Newgate] or has the {Land of Wano} type, give up to 1 of your opponent's rested Characters -6000 power during this turn",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            any: [
              {
                leader: {
                  name: 'Edward.Newgate',
                },
              },
              {
                leader: {
                  type: 'Land of Wano',
                },
              },
            ],
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    filter: {
                      state: 'rested',
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: -6000,
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
