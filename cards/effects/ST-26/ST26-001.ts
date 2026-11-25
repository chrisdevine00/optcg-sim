import type { CardScript } from '../../src/dsl.ts';

/** ST26-001 Soba Mask. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST26_001: CardScript = {
  cardId: 'ST26-001',
  textHash: '0a6421e7863d98',
  verified: {
    source: 'cards/overrides/ST26-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cheaper',
      label:
        'In hand: -5 cost while you have a [San-Gorou] or [Sanji] Character with 7000 base power or more',
      kind: 'permanent',
      zone: 'hand',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'you',
            filter: {
              all: [
                { any: [{ name: 'San-Gorou' }, { name: 'Sanji' }] },
                { basePower: { gte: 7000 } },
              ],
            },
          },
        },
      ],
      apply: [{ cost: { target: { from: 'self', owner: 'you' }, amount: -5 } }],
    },
    {
      id: 'on-play',
      label: "Return all of your [San-Gorou] and [Sanji] Characters to the owner's hand",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'you',
                filter: { any: [{ name: 'San-Gorou' }, { name: 'Sanji' }] },
              },
              to: { zone: 'hand' },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the discount tests BASE power (7000 inclusive; a 6000 Character with a given DON!! does not count); the Character must be on your field',
    'reading: the [On Play] is mandatory and returns every [San-Gorou] and [Sanji] Character of yours (exact names), Soba Mask itself is not one',
  ],
};
