import type { CardScript } from '../../src/dsl.ts';

/** OP14-114 Ran. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_114: CardScript = {
  cardId: 'OP14-114',
  textHash: '0579c2e145f5c1',
  verified: {
    source: 'cards/overrides/OP14-114.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'give',
      label: 'Give up to 1 rested DON!! to 1 of your {Kuja Pirates} Leader or Characters',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  type: 'Kuja Pirates',
                },
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'If your Leader has the {Kuja Pirates} type, play this card',
      kind: 'trigger',
      effect: [
        {
          if: {
            leader: {
              type: 'Kuja Pirates',
            },
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'self',
                    owner: 'you',
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
