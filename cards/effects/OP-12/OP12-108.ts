import type { CardScript } from '../../src/dsl.ts';

/** OP12-108 Donquixote Rosinante. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_108: CardScript = {
  cardId: 'OP12-108',
  textHash: '1c1dfe65e152dc',
  verified: {
    source: 'cards/overrides/OP12-108.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 5; reveal up to 1 [Trafalgar Law] to your hand; the rest to the bottom',
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
                    name: 'Trafalgar Law',
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
  ],
  rulings: [
    'Name filter honours alsoNamed: EB04-038 Rosinante & Law counts as [Trafalgar Law] in the deck (rules.alsoNamed)',
  ],
};
