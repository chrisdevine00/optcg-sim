import type { CardScript } from '../../src/dsl.ts';

/** EB05-011 Otohime. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_011: CardScript = {
  cardId: 'EB05-011',
  textHash: '072e370b3bc687',
  verified: {
    source: 'cards/overrides/EB05-011.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If your Leader is [Shirahoshi], you may turn 1 Life card face-down: rest up to 1 of your opponent's Characters with a cost of 5 or less",
      kind: 'auto',
      when: ['onPlay'],
      conditions: [
        {
          leader: {
            name: 'Shirahoshi',
          },
        },
      ],
      cost: [
        {
          turnLifeFaceDown: 1,
        },
      ],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 5,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the Leader condition precedes the "you may ... :" cost, so it is checked before the cost is offered',
    'reading: the Life card to turn is the top one and must be face-up (G8 shape)',
  ],
};
