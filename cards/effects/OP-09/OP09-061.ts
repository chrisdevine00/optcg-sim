import type { CardScript } from '../../src/dsl.ts';

/** OP09-061 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_061: CardScript = {
  cardId: 'OP09-061',
  textHash: '1985281494747f',
  verified: {
    source: 'cards/overrides/OP09-061.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'cost-up',
      label: '[DON!! x1] All of your Characters gain +1 cost',
      kind: 'permanent',
      conditions: [{ donGiven: 1 }],
      apply: [{ cost: { target: { from: 'characters', owner: 'you' }, amount: 1 } }],
    },
    {
      id: 'don-returned',
      label:
        'When 2 or more DON!! cards on your field are returned to your DON!! deck, add up to 1 DON!! card and set it as active, and add up to 1 additional DON!! card and rest it',
      kind: 'auto',
      when: [{ event: 'donReturned', owner: 'you', min: 2 }],
      oncePerTurn: true,
      conditions: [{ yourTurn: true }],
      effect: [
        {
          do: {
            addDon: [
              { n: 1, state: 'active', upTo: true },
              { n: 1, state: 'rested', upTo: true },
            ],
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (Q65 family): as EB02-035 for the DON!! return; "up to 1 additional" is a second independent addDon (asked as its own count); [DON!! x1] reads the Leader\'s own given DON!! (at least 1), +1 cost to every one of your Characters, Leader not included',
  ],
};
