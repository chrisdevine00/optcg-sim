import type { CardScript } from '../../src/dsl.ts';

/** OP17-004 Inuarashi & Nekomamushi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_004: CardScript = {
  cardId: 'OP17-004',
  textHash: '1185dface921a9',
  verified: {
    source: 'cards/overrides/OP17-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Up to 1 of your {Land of Wano} Characters or Characters with a type including "Whitebeard Pirates" gains [Rush] during this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  any: [
                    {
                      type: 'Land of Wano',
                    },
                    {
                      typeIncludes: 'Whitebeard Pirates',
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
