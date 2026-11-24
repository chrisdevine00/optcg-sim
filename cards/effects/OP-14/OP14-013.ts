import type { CardScript } from '../../src/dsl.ts';

/** OP14-013 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_013: CardScript = {
  cardId: 'OP14-013',
  textHash: '0b2871361ddfc0',
  verified: {
    source: 'cards/overrides/OP14-013.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 {Supernovas} card other than [Monkey.D.Luffy] and add it to your hand; the rest to the bottom',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    all: [
                      {
                        type: 'Supernovas',
                      },
                      {
                        not: {
                          name: 'Monkey.D.Luffy',
                        },
                      },
                    ],
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label: "Give up to 1 of your opponent's Characters -1000 power",
      kind: 'auto',
      when: ['whenAttacking'],
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
              amount: -1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: ['reading: a {Supernovas} card of any category is eligible (the text says "card")'],
};
