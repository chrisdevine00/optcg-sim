import type { CardScript } from '../../src/dsl.ts';

/** OP17-079 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_079: CardScript = {
  cardId: 'OP17-079',
  textHash: '1c95e3a2e215e4',
  verified: {
    source: 'cards/overrides/OP17-079.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'giant-blockers',
      label: 'All your Characters with a cost of 12 or more gain [Blocker]',
      kind: 'permanent',
      apply: [
        {
          grant: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: {
                cost: {
                  gte: 12,
                },
              },
            },
            keyword: 'Blocker',
          },
        },
      ],
    },
  ],
  rulings: [
    'RL-43 OP17-079, QA-OP17 OP17-079 row 1: negating the Leader removes the Blockers',
    'RL-43 OP17-079, QA-OP17 OP17-079 row 2: a Character whose own +12 is negated drops below 12 and loses [Blocker]',
  ],
};
