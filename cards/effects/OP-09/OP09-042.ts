import type { CardScript } from '../../src/dsl.ts';

/** OP09-042 Buggy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_042: CardScript = {
  cardId: 'OP09-042',
  textHash: '0fe2143d4bb016',
  verified: {
    source: 'cards/overrides/OP09-042.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'Rest 5 DON!! and trash 1 card from your hand: play up to 1 {Cross Guild} Character from your hand',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restDon: 5,
        },
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
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Cross Guild',
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
