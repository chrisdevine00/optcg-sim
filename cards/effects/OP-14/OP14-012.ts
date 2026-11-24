import type { CardScript } from '../../src/dsl.ts';

/** OP14-012 Bepo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_012: CardScript = {
  cardId: 'OP14-012',
  textHash: '0bcd49f45e1c09',
  verified: {
    source: 'cards/overrides/OP14-012.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        'If this has 5000 power or more, give up to 2 rested DON!! to your Leader or 1 of your Characters',
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          self: {
            power: {
              gte: 5000,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "up to 2 rested DON!!" asks a count (most first) when 2 or more are rested, then the target (Leader or 1 Character); all the DON!! go to one card',
  ],
};
