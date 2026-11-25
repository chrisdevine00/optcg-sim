import type { CardScript } from '../../src/dsl.ts';

/** OP11-092 Helmeppo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_092: CardScript = {
  cardId: 'OP11-092',
  textHash: '1454cd17e0c626',
  verified: {
    source: 'cards/overrides/OP11-092.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "You may trash 1 card from your hand: draw 1 card and play up to 1 {SWORD} Character with a cost of 8 or less other than [Helmeppo] from your trash; place it at the bottom of its owner's deck at the end of this turn",
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        { do: { draw: 1 } },
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { type: 'SWORD' },
                    { cost: { lte: 8 } },
                    { not: { name: 'Helmeppo' } },
                  ],
                },
                pick: { upTo: 1 },
                bind: 'played',
              },
            },
          },
        },
        {
          delayed: { at: 'endOfThisTurn' },
          do: [
            {
              do: {
                move: {
                  what: { from: 'characters', owner: 'any', filter: { ref: 'played' } },
                  to: { zone: 'deck', position: 'bottom' },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    "reading (G39, M6b-Q38): the Character played by this effect is placed at the bottom of its owner's deck at the end of this turn if it is still on the field; if it was K.O.'d, returned or otherwise left, nothing happens (it has a new identity off the field)",
    'reading: the draw happens before the play, so the drawn card cannot be the trash target; with no eligible Character in the trash the draw still happens',
  ],
};
