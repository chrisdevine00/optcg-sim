import type { CardScript } from '../../src/dsl.ts';

/** ST21-001 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST21_001: CardScript = {
  cardId: 'ST21-001',
  textHash: '1132e824a56d0b',
  verified: {
    source: 'cards/overrides/ST21-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label: '[DON!! x1] Give up to 2 rested DON!! cards to 1 of your Characters',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      conditions: [{ donGiven: 1 }],
      effect: [
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              to: { from: 'characters', owner: 'you', pick: { exactly: 1 } },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: [DON!! x1] is an activation condition (1 or more DON!! given to this Leader): with none given the ability is not offered and Once Per Turn is not spent; "up to 2" asks a count; the target is a Character only (not the Leader)',
  ],
};
