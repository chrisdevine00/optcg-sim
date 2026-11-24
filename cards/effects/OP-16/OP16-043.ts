import type { CardScript } from '../../src/dsl.ts';

/** OP16-043 Usopp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_043: CardScript = {
  cardId: 'OP16-043',
  textHash: '0ba44c1ea0d54f',
  verified: {
    source: 'cards/overrides/OP16-043.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-ko',
      label:
        "You may rest 1 of your {Dressrosa} Leader or Stage: return up to 1 of your opponent's Characters with a cost of 5 or less to the hand",
      kind: 'auto',
      when: ['onKO'],
      cost: [
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
            move: {
              what: {
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
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
};
