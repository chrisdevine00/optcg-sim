import type { CardScript } from '../../src/dsl.ts';

/** OP11-103 Long-Jaw Neptunian. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_103: CardScript = {
  cardId: 'OP11-103',
  textHash: '180c60671a405f',
  verified: {
    source: 'cards/overrides/OP11-103.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        "If your Leader is [Shirahoshi], you may rest this Character and turn 1 Life card face-down: K.O. up to 1 of your opponent's Characters with a cost of 3 or less",
      kind: 'activate',
      when: 'activateMain',
      conditions: [
        {
          leader: {
            name: 'Shirahoshi',
          },
        },
      ],
      cost: [
        {
          restSelf: true,
        },
        {
          turnLifeFaceDown: 1,
        },
      ],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 3,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the leading "If" before the colon is an activation condition: with another Leader the ability is not offered',
  ],
};
