import type { CardScript } from '../../src/dsl.ts';

/** OP17-096 I'm Luffy!! The Man Who Will Be King of the Pirates!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_096: CardScript = {
  cardId: 'OP17-096',
  textHash: '089264e4ca0230',
  verified: {
    source: 'cards/overrides/OP17-096.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'counter',
      label: 'If there is a Character with a cost of 12 or more, +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'any',
              filter: {
                cost: {
                  gte: 12,
                },
              },
            },
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
                  amount: 4000,
                  duration: 'battle',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Add up to 1 {Elbaph} card from your trash to your hand',
      kind: 'trigger',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  type: 'Elbaph',
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
};
