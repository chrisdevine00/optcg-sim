import type { CardScript } from '../../src/dsl.ts';

/** OP16-060 Sengoku. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_060: CardScript = {
  cardId: 'OP16-060',
  textHash: '1d4823ffd98e61',
  verified: {
    source: 'cards/overrides/OP16-060.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'admirals',
      label:
        'Return 8 active DON!! to the DON!! deck: play up to 3 {Admiral} Characters with different names from your hand',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          returnDon: {
            n: 8,
            state: 'active',
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
                      type: 'Admiral',
                    },
                  ],
                },
                pick: {
                  upTo: 3,
                  distinctNames: true,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
