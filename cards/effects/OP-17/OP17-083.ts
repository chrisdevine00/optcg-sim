import type { CardScript } from '../../src/dsl.ts';

/** OP17-083 Jinbe. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_083: CardScript = {
  cardId: 'OP17-083',
  textHash: '0ab385b8d20030',
  verified: {
    source: 'cards/overrides/OP17-083.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'big-blocker',
      label: 'With a Character of cost 12 or more: [Blocker] and +3000 power',
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
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Blocker',
          },
        },
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
  ],
};
