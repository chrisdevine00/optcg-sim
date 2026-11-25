import type { CardScript } from '../../src/dsl.ts';

/** ST17-003 Buggy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST17_003: CardScript = {
  cardId: 'ST17-003',
  textHash: '11570592f6c968',
  verified: {
    source: 'cards/overrides/ST17-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 3 cards from the top of your deck and place them at the top of your deck in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [{ do: { lookAtTop: { n: 3, take: [], rest: 'topAnyOrder' } } }],
    },
  ],
  rulings: ['G31 (wave 4): all looked-at cards go back on top, in an order you choose'],
};
