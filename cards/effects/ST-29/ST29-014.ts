import type { CardScript } from '../../src/dsl.ts';

/** ST29-014 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST29_014: CardScript = {
  cardId: 'ST29-014',
  textHash: '09c6a1c325b078',
  verified: {
    source: 'cards/overrides/ST29-014.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Rush: Character'],
  abilities: [
    {
      id: 'draw-don',
      label:
        'You may trash 1 card with a [Trigger] from your hand: draw 1 card and give up to 1 rested DON!! card to your Leader or 1 of your Characters',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          trash: { from: 'hand', owner: 'you', filter: { hasTrigger: true }, pick: { exactly: 1 } },
        },
      ],
      effect: [
        { do: { draw: 1 } },
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
    'reading: "Draw 1 and give" are two mandatory steps; the draw happens even with no rested DON!! to give',
  ],
};
