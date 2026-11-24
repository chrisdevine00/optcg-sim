import type { CardScript } from '../../src/dsl.ts';

/** OP12-090 Belo Betty. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_090: CardScript = {
  cardId: 'OP12-090',
  textHash: '1d2467bfaf45dc',
  verified: {
    source: 'cards/overrides/OP12-090.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label: 'You may trash 2 cards from the top of your deck: up to 1 opposing Character -2 cost',
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [
        {
          mill: 2,
        },
      ],
      effect: [
        {
          do: {
            cost: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -2,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
