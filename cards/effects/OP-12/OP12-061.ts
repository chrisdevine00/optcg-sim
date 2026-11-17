import type { CardScript } from '../../src/dsl.ts';

/** OP12-061 Donquixote Rosinante. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_061: CardScript = {
  cardId: 'OP12-061',
  textHash: '10ebf51acd6e8a',
  verified: {
    source: 'cards/overrides/OP12-061.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'law-shield',
      label:
        "If your [Trafalgar Law] would be K.O.'d, you may add the top Life card to your hand instead",
      kind: 'replacement',
      oncePerTurn: true,
      optional: true,
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            name: 'Trafalgar Law',
          },
        },
      },
      instead: [
        {
          lifeToHand: {
            from: 'top',
            n: 1,
          },
        },
      ],
    },
    {
      id: 'law-discount',
      label:
        'DON!! -1: the next [Trafalgar Law] (cost 4 or more) you play from your hand this turn costs 2 less',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            playCost: {
              next: {
                all: [
                  {
                    category: ['Character'],
                  },
                  {
                    name: 'Trafalgar Law',
                  },
                  {
                    cost: {
                      gte: 4,
                    },
                  },
                ],
              },
              from: 'hand',
              amount: -2,
              window: 'thisTurn',
              uses: 1,
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'RL-41 / QA-OP12 OP12-061: the Life-to-hand replacement cannot be used with 0 Life; it is not damage, so no [Trigger]',
    'effect-dsl.md E-Q2: an effect play pays no cost, so it neither uses nor spends the discount',
  ],
};
