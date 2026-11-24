import type { CardScript } from '../../src/dsl.ts';

/** OP16-001 Portgas.D.Ace. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_001: CardScript = {
  cardId: 'OP16-001',
  textHash: '14a1c6e12007be',
  verified: {
    source: 'cards/overrides/OP16-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush',
      label:
        'Up to 1 of your [Monkey.D.Luffy] Characters or Whitebeard Pirates Characters with 8000 power or more gains [Rush]',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
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
                      name: 'Monkey.D.Luffy',
                    },
                    {
                      all: [
                        {
                          typeIncludes: 'Whitebeard Pirates',
                        },
                        {
                          power: {
                            gte: 8000,
                          },
                        },
                      ],
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
