import type { CardScript } from '../../src/dsl.ts';

/** ST25-003 Crocodile & Mihawk. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST25_003: CardScript = {
  cardId: 'ST25-003',
  textHash: '0ade1805613bc3',
  verified: {
    source: 'cards/overrides/ST25-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Draw 2 cards and trash 1 card from your hand; then play up to 1 {Cross Guild} Character card with a cost of 4 or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        { do: { draw: 2 } },
        { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } },
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [{ category: ['Character'] }, { type: 'Cross Guild' }, { cost: { lte: 4 } }],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
    {
      id: 'shield',
      label:
        "Once Per Turn: if your {Cross Guild} Character would be removed from the field by your opponent's effect, you may trash 1 card from your hand instead",
      kind: 'replacement',
      oncePerTurn: true,
      replaces: {
        leaveField: { from: 'characters', owner: 'you', filter: { type: 'Cross Guild' } },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
    },
  ],
  rulings: [
    'reading: "Then, play" is not gated on the draw or the trash having happened (no If); the card trashed from the hand is chosen first, so it cannot be the card played; "up to 1" may be declined',
    'reading: the Once Per Turn replacement covers this Character itself (it has the Cross Guild type) and any other {Cross Guild} Character of yours; one use per turn in all, not one per Character',
  ],
};
