import type { CardScript } from '../../src/dsl.ts';

/** OP17-091 Brook. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_091: CardScript = {
  cardId: 'OP17-091',
  textHash: '10e537d5de6052',
  verified: {
    source: 'cards/overrides/OP17-091.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'big-power',
      label: '+3000 power while a Character with a cost of 12 or more exists',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'any',
            filter: {
              cost: {
                gte: 12,
              },
            },
          },
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 3000,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'If there is a Character with a cost of 12 or more, your opponent trashes 1 card from their hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'any',
              filter: {
                cost: {
                  gte: 12,
                },
              },
            },
          },
          then: [
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'opponent',
                  chooser: 'opponent',
                  pick: {
                    exactly: 1,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
