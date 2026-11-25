import type { CardScript } from '../../src/dsl.ts';

/** OP12-113 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_113: CardScript = {
  cardId: 'OP12-113',
  textHash: '11474ac69dae44',
  verified: {
    source: 'cards/overrides/OP12-113.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        'If your Leader has the "Supernovas" type, play up to 1 "Supernovas" type Character card with a cost of 4 or less from your hand rested',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          if: { leader: { type: 'Supernovas' } },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      all: [
                        { category: ['Character'] },
                        { type: 'Supernovas' },
                        { cost: { lte: 4 } },
                      ],
                    },
                    pick: { upTo: 1 },
                  },
                  rested: true,
                },
              },
            },
          ],
        },
      ],
    },
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
    'reading: the quoted "Supernovas" type is the exact type {Supernovas} for the Leader and the card (the official text prints the exact type this way); the "If" has no colon, so it is an effect condition; the played Character enters rested',
    "reading (G57): as OP12-109, the card is added to the hand whether or not a Character was K.O.'d. The verified [Trigger] text is the same as OP12-109 Pacifista's (checked against the card data and the override; reported for a re-check against the official list)",
    'hidden information: the hand play is "up to 1", asked at max 0 whether or not the hand holds a Supernovas Character (the hand is hidden); the gate is the public Leader type',
  ],
};
