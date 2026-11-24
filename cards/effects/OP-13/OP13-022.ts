import type { CardScript } from '../../src/dsl.ts';

/** OP13-022 Windmill Village. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_022: CardScript = {
  cardId: 'OP13-022',
  textHash: '1afbfa76e231cc',
  verified: {
    source: 'cards/overrides/OP13-022.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Rest this Stage: up to 1 of your Characters with 2000 base power or less gains +1000 power',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  basePower: {
                    lte: 2000,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
