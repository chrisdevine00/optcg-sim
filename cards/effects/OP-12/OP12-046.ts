import type { CardScript } from '../../src/dsl.ts';

/** OP12-046 Zephyr(Navy). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_046: CardScript = {
  cardId: 'OP12-046',
  textHash: '11b6c2ad31c36a',
  verified: {
    source: 'cards/overrides/OP12-046.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Trash 2 cards from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [{ do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 2 } } } }],
    },
    {
      id: 'bounce',
      label:
        "You may trash this Character: return up to 1 Character with a cost of 5 or less to the owner's hand",
      kind: 'activate',
      when: 'activateMain',
      cost: [{ trashSelf: true }],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: { cost: { lte: 5 } },
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
    'Reading: "Return up to 1 Character" names no owner, so a Character of either side qualifies (current cost); Zephyr is already in the trash when the effect resolves and cannot be returned',
    'Reading: the [On Play] trash is not optional; with fewer than 2 cards in hand all of them are trashed',
  ],
};
