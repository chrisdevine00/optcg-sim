import type { CardScript } from '../../src/dsl.ts';

/** OP10-093 Saint Homing. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_093: CardScript = {
  cardId: 'OP10-093',
  textHash: '0137d6d7a6a29c',
  verified: {
    source: 'cards/overrides/OP10-093.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        "Trash this Character: up to 1 of your black Characters gains +3 cost until the end of your opponent's next turn",
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
            cost: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  color: 'Black',
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 3,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
};
