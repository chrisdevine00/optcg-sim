import type { CardScript } from '../../src/dsl.ts';

/** OP17-104 Charlotte Cracker. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_104: CardScript = {
  cardId: 'OP17-104',
  textHash: '05f6100df77ba2',
  verified: {
    source: 'cards/overrides/OP17-104.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Your turn, rest 2 DON!!: with a {Big Mom Pirates} Leader, add up to 1 deck card to your Life',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [{ yourTurn: true }],
      cost: [{ restDon: 2 }],
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
    'reading: the Leader type is an "if" in the effect, so the 2 DON!! are rested even with another Leader type (the cost is before the colon)',
  ],
};
