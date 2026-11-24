import type { CardScript } from '../../src/dsl.ts';

/** OP13-120 Sabo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_120: CardScript = {
  cardId: 'OP13-120',
  textHash: '10f903c22fc549',
  verified: {
    source: 'cards/overrides/OP13-120.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'activate',
      label:
        "Up to 1 of your Characters gains +2 cost until the end of opponent's next turn; then give up to 1 rested DON!! to your Leader",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            cost: {
              target: {
                from: 'characters',
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 2,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: 'leader',
                owner: 'you',
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
