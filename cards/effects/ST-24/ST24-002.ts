import type { CardScript } from '../../src/dsl.ts';

/** ST24-002 Kid & Killer. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST24_002: CardScript = {
  cardId: 'ST24-002',
  textHash: '159418f8557c57',
  verified: {
    source: 'cards/overrides/ST24-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 {Supernovas} card and add it to your hand; the rest to the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                { pick: { upTo: 1 }, filter: { type: 'Supernovas' }, reveal: true, to: 'hand' },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
    {
      id: 'opp-attack',
      label:
        "[On Your Opponent's Attack] You may trash this Character: set up to 1 of your DON!! cards as active",
      kind: 'auto',
      when: ['onOpponentAttack'],
      cost: [{ trashSelf: true }],
      effect: [{ do: { setActive: { from: 'donCostArea', owner: 'you', pick: { upTo: 1 } } } }],
    },
  ],
  rulings: [
    'reading: any category of "Supernovas" type card may be taken (Characters, Events, Stages); the exact type element, not a substring',
    'reading: the trash cost is optional by construction (CR 8-3-1-4) and has no Once Per Turn, so it is asked at every opponent attack while this Character is on the field',
  ],
};
