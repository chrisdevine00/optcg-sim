import type { CardScript } from '../../src/dsl.ts';

/** OP03-122 Sogeking. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP03_122: CardScript = {
  cardId: 'OP03-122',
  textHash: '11dfaa874823d7',
  verified: {
    source: 'cards/overrides/OP03-122.json (card text in cards/data)',
    date: '2026-11-24',
  },
  rules: [{ alsoNamed: ['Usopp'] }],
  abilities: [
    {
      id: 'on-play',
      label:
        "Return up to 1 Character with cost 6 or less to the owner's hand; draw 2 cards and trash 2 cards from your hand",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: { cost: { lte: 6 } },
                pick: { upTo: 1 },
              },
              to: { zone: 'hand' },
            },
          },
        },
        { do: { draw: 2 } },
        { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 2 } } } },
      ],
    },
  ],
  rulings: [
    'Reading: "Then, draw 2 and trash 2" is not "If you do": it happens even when no Character was returned',
    "The returned Character may be either player's, including Sogeking itself",
  ],
};
