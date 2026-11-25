import type { CardScript } from '../../src/dsl.ts';

/** EB02-046 Hildon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_046: CardScript = {
  cardId: 'EB02-046',
  textHash: '0867f63a5464e5',
  verified: {
    source: 'cards/overrides/EB02-046.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Trash 2 cards from the top of your deck; give up to 1 of your opponent's Characters -1 cost this turn",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            mill: {
              player: 'you',
              n: 2,
            },
          },
        },
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
              amount: -1,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Read: the trash is mandatory (as many as the deck holds) and the cost reduction does not depend on it ("and" joins two independent instructions)',
  ],
};
