import type { CardScript } from '../../src/dsl.ts';

/** OP17-103 Charlotte Katakuri. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_103: CardScript = {
  cardId: 'OP17-103',
  textHash: '1a172f77c8e7a1',
  verified: {
    source: 'cards/overrides/OP17-103.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Your turn: with a {Big Mom Pirates} Leader, add up to 1 deck card to your Life; then give up to 1 of your opponent's Characters -3000 power during this turn",
      kind: 'auto',
      when: ['onPlay'],
      conditions: [{ yourTurn: true }],
      effect: [
        {
          if: { leader: { type: 'Big Mom Pirates' } },
          then: [
            {
              do: {
                move: {
                  what: { from: 'deckTop', owner: 'you', pick: { upTo: 1 } },
                  to: { zone: 'life', position: 'top' },
                },
              },
            },
            {
              do: {
                power: {
                  target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
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
      label: 'Play this card',
      kind: 'trigger',
      effect: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
    },
  ],
  rulings: [
    'audit Q10: "Then, give ... -3000" is inside the Leader-type "if" (not "If you do": it happens even if the Life card was declined)',
    "reading: [Your Turn] is an ability condition, so a [Trigger] play on the opponent's turn adds no Life and gives no -3000",
  ],
};
