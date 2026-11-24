import type { CardScript } from '../../src/dsl.ts';

/** OP12-047 Sengoku. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_047: CardScript = {
  cardId: 'OP12-047',
  textHash: '17fb8177804c62',
  verified: {
    source: 'cards/overrides/OP12-047.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may trash 1 card from your hand: look at 5, reveal up to 2 {Navy} cards other than [Sengoku] and add them to your hand; place the rest at the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: { upTo: 2 },
                  filter: { all: [{ type: 'Navy' }, { not: { name: 'Sengoku' } }] },
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
    'Reading: any {Navy} card of any category qualifies ("cards"), at most 2 of them; the search may take nothing (CR 8-4-4-2); the rest go to the bottom in an order the owner chooses',
  ],
};
