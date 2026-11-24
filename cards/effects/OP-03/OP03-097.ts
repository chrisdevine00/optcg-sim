import type { CardScript } from '../../src/dsl.ts';

/** OP03-097 Six King Pistol. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP03_097: CardScript = {
  cardId: 'OP03-097',
  textHash: '078fc49bfc8654',
  verified: {
    source: 'cards/overrides/OP03-097.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'You may trash 1 card from your hand: up to 1 Leader or Character gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      costOptional: true,
      effect: [
        {
          do: {
            power: {
              target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        "Draw 1 card; then K.O. up to 1 of your opponent's Characters with a cost of 1 or less",
      kind: 'trigger',
      effect: [
        { do: { draw: 1 } },
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
      ],
    },
  ],
  rulings: [
    'reading: "Then" is not "If you do": the K.O. is available even though the draw is mandatory and always happens',
  ],
};
