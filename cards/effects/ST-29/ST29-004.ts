import type { CardScript } from '../../src/dsl.ts';

/** ST29-004 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST29_004: CardScript = {
  cardId: 'ST29-004',
  textHash: '06fc3e9b1d92e0',
  verified: {
    source: 'cards/overrides/ST29-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 4; reveal up to 1 {Straw Hat Crew} card and add it to your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 4,
              take: [
                { pick: { upTo: 1 }, filter: { type: 'Straw Hat Crew' }, reveal: true, to: 'hand' },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'You may trash 1 card from your hand: play this card',
      kind: 'trigger',
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
    },
  ],
  rulings: [
    'reading: any {Straw Hat Crew} card of any category, including another [Sanji], may be taken',
  ],
};
