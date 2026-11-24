import type { CardScript } from '../../src/dsl.ts';

/** OP16-103 Van Augur. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_103: CardScript = {
  cardId: 'OP16-103',
  textHash: '08a6cc0abacd87',
  verified: {
    source: 'cards/overrides/OP16-103.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        "On your opponent's turn, with a {Blackbeard Pirates} Leader: draw 1 and give up to 1 of your opponent's Leader or Characters -3000 power",
      kind: 'auto',
      when: ['onKO'],
      conditions: [{ opponentsTurn: true }],
      effect: [
        {
          if: { leader: { type: 'Blackbeard Pirates' } },
          then: [
            { do: { draw: 1 } },
            {
              do: {
                power: {
                  target: { from: ['leader', 'characters'], owner: 'opponent', pick: { upTo: 1 } },
                  amount: -3000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: "Activate this card's [On K.O.] effect",
      kind: 'trigger',
      effect: [{ do: { activate: { ability: 'onKO', of: 'self' } } }],
    },
  ],
  rulings: [
    "reading: [Opponent's Turn] is an ability condition on the [On K.O.]; the [Trigger] activation (always on the opponent's turn) re-checks it and the Leader type",
  ],
};
