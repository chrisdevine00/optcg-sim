import type { CardScript } from '../../src/dsl.ts';

/** OP13-007 Ace & Sabo & Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_007: CardScript = {
  cardId: 'OP13-007',
  textHash: '1b9de4be7a2d6c',
  verified: {
    source: 'cards/overrides/OP13-007.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Give 1 active DON!! to your Leader or a Character and trash this Character: opposing Character -3000',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          giveDon: {
            n: 1,
            state: 'active',
            to: {
              from: ['leader', 'characters'],
              owner: 'you',
              pick: {
                exactly: 1,
              },
            },
          },
        },
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -3000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
