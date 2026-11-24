import type { CardScript } from '../../src/dsl.ts';

/** EB04-034 Charlotte Pudding. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_034: CardScript = {
  cardId: 'EB04-034',
  textHash: '0d8624ad72a815',
  verified: {
    source: 'cards/overrides/EB04-034.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'opp-attack',
      label:
        'Once per turn, trash 1 card: with 4 or more Events in your trash, your Leader or a Character gains +2000 power during this battle',
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'trash',
                  owner: 'you',
                  filter: {
                    category: ['Event'],
                  },
                },
              },
              '>=',
              4,
            ],
          },
          then: [
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
                  amount: 2000,
                  duration: 'battle',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
