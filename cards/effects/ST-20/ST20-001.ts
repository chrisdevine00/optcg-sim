import type { CardScript } from '../../src/dsl.ts';

/** ST20-001 Charlotte Katakuri. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST20_001: CardScript = {
  cardId: 'ST20-001',
  textHash: '1ee4f9c0914f32',
  verified: {
    source: 'cards/overrides/ST20-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'activate',
      label:
        'You may turn 1 card from the top of your Life cards face-up: give up to 1 rested DON!! card to your Leader or 1 of your Characters',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [{ turnLifeFaceUp: 1 }],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: { from: ['leader', 'characters'], owner: 'you', pick: { exactly: 1 } },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b-Q59): "turn 1 card from the top of your Life cards face-up" needs a face-down top card; with the top card already face-up the cost cannot be paid',
  ],
};
