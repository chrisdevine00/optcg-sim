import type { CardScript } from '../../src/dsl.ts';

/** EB04-041 Stealth Black. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_041: CardScript = {
  cardId: 'EB04-041',
  textHash: '16b70c96c9e8b3',
  verified: {
    source: 'cards/overrides/EB04-041.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'With [Sanji] as Leader and 4 or more DON!!, play up to 1 [Sanji] with 6000 power or less from hand or trash',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  name: 'Sanji',
                },
              },
              {
                cmp: [
                  {
                    donOnField: 'you',
                  },
                  '>=',
                  4,
                ],
              },
            ],
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: ['hand', 'trash'],
                    owner: 'you',
                    filter: {
                      all: [
                        {
                          category: ['Character'],
                        },
                        {
                          name: 'Sanji',
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
    {
      id: 'trigger',
      label: 'Draw 2 cards and trash 1 card from your hand',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 2,
          },
        },
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'you',
              pick: {
                exactly: 1,
              },
            },
          },
        },
      ],
    },
  ],
};
