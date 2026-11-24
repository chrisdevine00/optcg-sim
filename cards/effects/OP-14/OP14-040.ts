import type { CardScript } from '../../src/dsl.ts';

/** OP14-040 Jinbe. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_040: CardScript = {
  cardId: 'OP14-040',
  textHash: '1e0015a7b45934',
  verified: {
    source: 'cards/overrides/OP14-040.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'give',
      label:
        'You may trash 1 card from your hand: give up to 2 rested DON!! cards to 1 of your {Fish-Man} or {Merfolk} type Leader or Characters',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              to: {
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
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
