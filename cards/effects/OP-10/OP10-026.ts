import type { CardScript } from '../../src/dsl.ts';

/** OP10-026 Kin'emon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_026: CardScript = {
  cardId: 'OP10-026',
  textHash: '0af0f67c6f8719',
  verified: {
    source: 'cards/overrides/OP10-026.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'activate',
      label:
        "You may place this Character and 1 [Kin'emon] with 0 power from your trash at the bottom of your deck in any order: play up to 1 [Kin'emon] with a cost of 6 from your hand",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          move: { from: 'self', owner: 'you', pick: { exactly: 1 } },
          to: { zone: 'deck', position: 'bottom' },
        },
        {
          move: {
            from: 'trash',
            owner: 'you',
            filter: { all: [{ name: "Kin'emon" }, { power: { eq: 0 } }] },
            pick: { exactly: 1 },
          },
          to: { zone: 'deck', position: 'bottom' },
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: { all: [{ name: "Kin'emon" }, { cost: { eq: 6 } }] },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b-Q73): "in any order" with two cards is the two costs in the order written, this Character first, then the card from the trash, so the order is not asked; this Character leaves through a cost removal (its DON!! return) and the ability is not payable once it is not on the field',
  ],
};
