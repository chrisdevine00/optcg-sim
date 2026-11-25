import type { CardScript } from '../../src/dsl.ts';

/** ST16-005 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST16_005: CardScript = {
  cardId: 'ST16-005',
  textHash: '086b24d9662ea1',
  verified: {
    source: 'cards/overrides/ST16-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'power',
      label: 'If you have a rested [Uta], +1000 power',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: ['leader', 'characters'],
            owner: 'you',
            filter: { all: [{ name: 'Uta' }, { state: 'rested' }] },
          },
        },
      ],
      apply: [{ power: { target: { from: 'self', owner: 'you' }, amount: 1000 } }],
    },
  ],
  rulings: [
    'reading: "a rested [Uta]" is a rested Leader or Character of yours named [Uta] (the text does not say Character); an active [Uta] or an opponent\'s does not count',
  ],
};
