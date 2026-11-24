import type { CardScript } from '../../src/dsl.ts';

/** ST29-017 Iai Death Lion Song. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST29_017: CardScript = {
  cardId: 'ST29-017',
  textHash: '0e4f8037c3e81e',
  verified: {
    source: 'cards/overrides/ST29-017.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        "Up to 1 of your Leader or Character cards gains +4000 power during this battle; then, with 2 or less Life, K.O. up to 1 of your opponent's Characters with a cost of 3 or less",
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
              amount: 4000,
              duration: 'battle',
            },
          },
        },
        {
          if: { cmp: [{ life: 'you' }, '<=', 2] },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: { cost: { lte: 3 } },
                  pick: { upTo: 1 },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 2 cards and trash 1 card from your hand',
      kind: 'trigger',
      effect: [
        { do: { draw: 2 } },
        { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } },
      ],
    },
  ],
  rulings: [
    'reading (M4b-5): "Then, if" is its own condition; the boost may be declined and the K.O. still happens',
  ],
};
