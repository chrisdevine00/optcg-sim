import type { CardScript } from '../../src/dsl.ts';

/** OP18-101 Kumadori. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_101: CardScript = {
  cardId: 'OP18-101',
  textHash: '0b7132468f4427',
  verified: {
    source: 'cards/overrides/OP18-101.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        'Add up to 1 card with a type including "CP" from your hand to the top or bottom of your Life cards face-up',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: { typeIncludes: 'CP' },
                pick: { upTo: 1 },
              },
              to: { zone: 'life', position: 'topOrBottom', faceUp: true },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        'If your Leader\'s type includes "CP", K.O. or rest up to 1 of your opponent\'s Characters with a cost of 6 or less',
      kind: 'trigger',
      effect: [
        {
          if: { leader: { typeIncludes: 'CP' } },
          then: [
            {
              chooseOne: [
                [
                  {
                    do: {
                      ko: {
                        from: 'characters',
                        owner: 'opponent',
                        filter: { cost: { lte: 6 } },
                        pick: { upTo: 1 },
                      },
                    },
                  },
                ],
                [
                  {
                    do: {
                      rest: {
                        from: 'characters',
                        owner: 'opponent',
                        filter: { cost: { lte: 6 } },
                        pick: { upTo: 1 },
                      },
                    },
                  },
                ],
              ],
              labels: [
                "K.O. up to 1 of your opponent's Characters with a cost of 6 or less",
                "Rest up to 1 of your opponent's Characters with a cost of 6 or less",
              ],
            },
          ],
        },
      ],
    },
  ],
  rulings: ['OP-18 wave G3: the controller picks the Life end; the card arrives face-up'],
};
