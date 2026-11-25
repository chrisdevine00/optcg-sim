import type { CardScript } from '../../src/dsl.ts';

/** OP09-052 Marco. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_052: CardScript = {
  cardId: 'OP09-052',
  textHash: '0f399cfe49552f',
  verified: {
    source: 'cards/overrides/OP09-052.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'ko-return',
      label:
        "Opponent's Turn, you may trash 1 card from your hand: when this Character is K.O.'d by your opponent's effect, play this Character card from your trash rested",
      kind: 'auto',
      when: ['onKO'],
      conditions: [
        {
          opponentsTurn: true,
        },
        {
          koCause: 'opponentEffect',
        },
      ],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'self',
                owner: 'you',
              },
              rested: true,
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "reading: the colon follows \"You may trash 1 card from your hand\", so the trash is the (optional) cost and the K.O. trigger (opponent's effect, on the opponent's turn) is the condition; a battle K.O. or a K.O. by your own effect does not trigger it; `from: 'self'` is safe because the cost trashes a hand card, not Marco",
  ],
};
