import type { CardScript } from '../../src/dsl.ts';

/** OP18-018 Let's Go, Karoo!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_018: CardScript = {
  cardId: 'OP18-018',
  textHash: '07f4bde9281b76',
  verified: {
    source: 'cards/overrides/OP18-018.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'main',
      label: 'All of your {Alabasta} Characters gain +1000 power this turn',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  type: 'Alabasta',
                },
              },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Up to 1 of your Leader or Characters gains +2000 power this turn',
      kind: 'trigger',
      effect: [
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
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'the m6b audit row listed the +2000 under [Main]; the card text has [Main] +1000 on all {Alabasta} Characters and the [Trigger] +2000 on up to 1 Leader or Character',
  ],
};
