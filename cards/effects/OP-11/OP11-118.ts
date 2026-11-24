import type { CardScript } from '../../src/dsl.ts';

/** OP11-118 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_118: CardScript = {
  cardId: 'OP11-118',
  textHash: '011d3ceabc01c1',
  verified: {
    source: 'cards/overrides/OP11-118.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Rush'],
  abilities: [
    {
      id: 'when-attacking',
      label:
        "You may trash 1 card from your hand: return up to 1 Character with a cost of 4 or less to the owner's hand; then give up to 1 rested DON!! to your Leader or 1 of your Characters",
      kind: 'auto',
      when: ['whenAttacking'],
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
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 4,
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
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
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
  rulings: [
    'reading: "Then" is not "if you do": the rested DON!! is given even if no Character was returned; the Character may be either player\'s',
  ],
};
