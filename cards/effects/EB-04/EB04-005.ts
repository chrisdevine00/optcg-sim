import type { CardScript } from '../../src/dsl.ts';

/** EB04-005 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_005: CardScript = {
  cardId: 'EB04-005',
  textHash: '03e7f98a7db4ed',
  verified: {
    source: 'cards/overrides/EB04-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'no-attack',
      label:
        'This Character cannot attack unless your opponent has 2 or more Characters with a base power of 5000 or more',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              count: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  basePower: {
                    gte: 5000,
                  },
                },
              },
            },
            '<',
            2,
          ],
        },
      ],
      apply: [
        {
          restrict: {
            target: {
              from: 'self',
              owner: 'you',
            },
            what: 'cannotAttack',
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the lock is live (checked as the attack is declared); BASE power 5000 or more, so a boosted 4000 does not count and a DON!!-boosted 5000-base counts as before; Rested Characters count; the Leader never counts',
  ],
};
