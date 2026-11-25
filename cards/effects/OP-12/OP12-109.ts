import type { CardScript } from '../../src/dsl.ts';

/** OP12-109 Pacifista. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_109: CardScript = {
  cardId: 'OP12-109',
  textHash: '0242acb8eb1163',
  verified: {
    source: 'cards/overrides/OP12-109.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trigger',
      label:
        "K.O. up to 1 of your opponent's Characters with a cost of 1 or less and add this card to your hand",
      kind: 'trigger',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 1 } },
              pick: { upTo: 1 },
            },
          },
        },
        {
          do: {
            move: {
              what: { from: 'self', owner: 'you', pick: { exactly: 1 } },
              to: { zone: 'hand' },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (G57): "and add this card to your hand" is not conditioned on the K.O.: the card goes to the hand whether or not a Character was K.O.\'d; the K.O. is "up to 1", asked at max 0 with no target',
  ],
};
