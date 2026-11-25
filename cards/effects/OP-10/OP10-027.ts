import type { CardScript } from '../../src/dsl.ts';

/** OP10-027 Kin'emon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_027: CardScript = {
  cardId: 'OP10-027',
  textHash: '1c2f5497914ad6',
  verified: {
    source: 'cards/overrides/OP10-027.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        "You may place this Character and 1 [Kin'emon] with 1000 power from your trash at the bottom of your deck in any order: play up to 1 [Kin'emon] with a cost of 6 from your hand",
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
            filter: { all: [{ name: "Kin'emon" }, { power: { eq: 1000 } }] },
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
    'reading (G52, M6b-Q73): "in any order" is not asked: the two costs are paid in the order written, this Character first and the trash card after it, so the trash card is the last card of the deck (both are named Kin\'emon and the deck is hidden)',
    'reading: "with a cost of 6" is exactly 6 (not 6 or less); "with 1000 power" in the trash is its power (the printed 1000; this card itself has 0 and does not qualify)',
    'reading: the cost is the whole ability: it is not offered unless this Character is on the field and the trash holds a [Kin\'emon] with 1000 power; the hand play is "up to 1" asked at max 0 (the hand is hidden, so no gate on it)',
  ],
};
