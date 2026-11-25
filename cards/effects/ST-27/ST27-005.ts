import type { CardScript } from '../../src/dsl.ts';

/** ST27-005 Marshall.D.Teach. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST27_005: CardScript = {
  cardId: 'ST27-005',
  textHash: '1875b42f3cff2b',
  verified: {
    source: 'cards/overrides/ST27-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'ko',
      label: 'You may rest this Character: K.O. up to 1 Character with a cost of 3 or less',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ restSelf: true }],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'any',
              filter: { cost: { lte: 3 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'Add up to 1 black card from your trash to your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: { color: 'Black' },
                pick: { upTo: 1 },
              },
              to: { zone: 'hand' },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "up to 1 Character" is either side\'s (your own included), cost 3 inclusive; the cost is paid first, so a rested Teach cannot activate; "black card" is any category with Black among its colors',
  ],
};
