import type { CardScript } from '../../src/dsl.ts';

/** OP18-029 Tony Tony.Chopper. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_029: CardScript = {
  cardId: 'OP18-029',
  textHash: '154b72f3475939',
  verified: {
    source: 'cards/overrides/OP18-029.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  keywords: ['Rush'],
  abilities: [
    {
      id: 'when-attacking',
      label:
        'Give up to 3 rested DON!! cards to your Leader and set this Character as active; then this Character will not become active in your next Refresh Phase',
      kind: 'auto',
      when: ['whenAttacking'],
      oncePerTurn: true,
      effect: [
        {
          do: {
            giveDon: {
              n: 3,
              state: 'rested',
              to: { from: 'leader', owner: 'you', pick: { exactly: 1 } },
            },
          },
        },
        { do: { setActive: { from: 'self', owner: 'you' } } },
        { do: { skipRefresh: { from: 'self', owner: 'you' } } },
      ],
    },
  ],
  rulings: [
    'reading (M6b audit Q15 family): "Then" is not "If you do": the Refresh skip applies whether or not the Character was rested and whether or not DON!! went out; it ends after your next Refresh Phase',
  ],
};
