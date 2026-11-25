import type { CardScript } from '../../src/dsl.ts';

/** EB02-006 Yamato. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_006: CardScript = {
  cardId: 'EB02-006',
  textHash: '180cfa044e5850',
  verified: {
    source: 'cards/overrides/EB02-006.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'give-don',
      label:
        'If your Leader has {Land of Wano} or is [Portgas.D.Ace]: give up to 1 rested DON!! to your Leader; this Character gains [Rush] this turn',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          if: {
            leader: {
              any: [
                {
                  type: 'Land of Wano',
                },
                {
                  name: 'Portgas.D.Ace',
                },
              ],
            },
          },
          then: [
            {
              do: {
                giveDon: {
                  n: 1,
                  state: 'rested',
                  to: {
                    from: 'leader',
                    owner: 'you',
                  },
                },
              },
            },
            {
              do: {
                grant: {
                  target: {
                    from: 'self',
                    owner: 'you',
                  },
                  keyword: 'Rush',
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
    'reading: the "If" has no cost colon before it, so it is an effect condition (DECISIONS 2026-11-24, B3A-R1): the ability can be activated at any time, Once Per Turn is spent, and nothing happens when it is false',
    'reading: "Then, this Character gains [Rush]" is inside the guard and is not "if you do": it happens even with no rested DON!! to give',
  ],
};
