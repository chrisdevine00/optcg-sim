import type { CardScript } from '../../src/dsl.ts';

/** ST28-002 Izo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST28_002: CardScript = {
  cardId: 'ST28-002',
  textHash: '06ed8a6d7c3669',
  verified: {
    source: 'cards/overrides/ST28-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label: '[DON!! x2] This Character gains [Blocker]',
      kind: 'permanent',
      conditions: [{ donGiven: 2 }],
      apply: [{ grant: { target: { from: 'self', owner: 'you' }, keyword: 'Blocker' } }],
    },
    {
      id: 'on-play',
      label: 'Your {Land of Wano} Leader gains [Banish] during this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            grant: {
              target: { from: 'leader', owner: 'you', filter: { type: 'Land of Wano' } },
              keyword: 'Banish',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: [Blocker] is gained, not printed, so keywords stays empty; with a Leader that is not {Land of Wano} the [On Play] grants nothing',
  ],
};
