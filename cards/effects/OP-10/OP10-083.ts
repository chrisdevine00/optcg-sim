import type { CardScript } from '../../src/dsl.ts';

/** OP10-083 Kouzuki Momonosuke. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_083: CardScript = {
  cardId: 'OP10-083',
  textHash: '1f0e18af61d7e7',
  verified: {
    source: 'cards/overrides/OP10-083.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'Rest this Character and 1 of your Dressrosa Leader or Stage: give up to 1 opposing Character -2 cost during this turn',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
        {
          rest: {
            from: ['leader', 'stage'],
            owner: 'you',
            filter: {
              type: 'Dressrosa',
            },
            pick: {
              exactly: 1,
            },
          },
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
