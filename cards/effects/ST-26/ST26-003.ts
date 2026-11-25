import type { CardScript } from '../../src/dsl.ts';

/** ST26-003 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST26_003: CardScript = {
  cardId: 'ST26-003',
  textHash: '097966171991c3',
  verified: {
    source: 'cards/overrides/ST26-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'DON!! -2: add up to 1 DON!! card from your DON!! deck and set it as active',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ donMinus: 2 }],
      effect: [{ do: { addDon: [{ n: 1, state: 'active', upTo: true }] } }],
    },
  ],
  rulings: [
    'reading: DON!! -2 is the optional DON!! -X cost (RL-52); the 2 DON!! returned go to the DON!! deck first, so the add is never short; "add up to 1" asks a count (1 or 0)',
  ],
};
