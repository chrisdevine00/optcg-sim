import type { CardScript } from '../../src/dsl.ts';

/** OP12-059 Concasser. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_059: CardScript = {
  cardId: 'OP12-059',
  textHash: '077cc998f0ffe7',
  verified: {
    source: 'cards/overrides/OP12-059.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: 'If your Leader is [Sanji], draw 1 card',
      kind: 'activate',
      when: 'main',
      effect: [{ if: { leader: { name: 'Sanji' } }, then: [{ do: { draw: 1 } }] }],
    },
    {
      id: 'counter',
      label:
        'If you have 4 or more Events in your trash, your Leader gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          if: {
            cmp: [
              { count: { from: 'trash', owner: 'you', filter: { category: ['Event'] } } },
              '>=',
              4,
            ],
          },
          then: [
            {
              do: {
                power: {
                  target: { from: 'leader', owner: 'you' },
                  amount: 4000,
                  duration: 'battle',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'Reading: Concasser is in the trash when its [Counter] resolves (CR 8-4-2) and counts toward the 4; the target is the Leader only (the text says "Leader", not "Leader or Character")',
  ],
};
