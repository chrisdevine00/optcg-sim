import type { CardScript } from '../../src/dsl.ts';

/** OP18-049 Mr.2.Bon.Kurei(Bentham). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_049: CardScript = {
  cardId: 'OP18-049',
  textHash: '17fe5eeb5d161a',
  verified: {
    source: 'cards/overrides/OP18-049.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5 cards from the top of your deck; reveal up to 1 card with a type including "Baroque Works" and add it to your hand, the rest to the bottom in any order; then give up to 1 rested DON!! card to your Leader or 1 of your Characters',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: { upTo: 1 },
                  filter: { typeIncludes: 'Baroque Works' },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: { from: ['leader', 'characters'], owner: 'you', pick: { exactly: 1 } },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (as OP12-031): "Then" is not "If you do": the DON!! is given whether or not a card was taken; the target is exactly 1 and the DON!! "up to 1"',
  ],
};
