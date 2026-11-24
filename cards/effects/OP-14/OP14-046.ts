import type { CardScript } from '../../src/dsl.ts';

/** OP14-046 Koala. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_046: CardScript = {
  cardId: 'OP14-046',
  textHash: '05b8d2f7e2e085',
  verified: {
    source: 'cards/overrides/OP14-046.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'boost',
      label:
        'You may trash this Character: up to 1 of your {Fish-Man} or {Merfolk} type Leader or Characters gains +2000 power during this turn',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  any: [
                    {
                      type: 'Fish-Man',
                    },
                    {
                      type: 'Merfolk',
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
