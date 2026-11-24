import type { CardScript } from '../../src/dsl.ts';

/** OP01-120 Shanks. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP01_120: CardScript = {
  cardId: 'OP01-120',
  textHash: '08bfabd8fbda09',
  verified: {
    source: 'cards/overrides/OP01-120.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Rush'],
  abilities: [
    {
      id: 'when-attacking',
      label:
        'Your opponent cannot activate a [Blocker] Character that has 2000 or less power during this battle',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: { all: [{ keyword: 'Blocker' }, { power: { lte: 2000 } }] },
              },
              what: 'cannotActivateBlocker',
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading (M6b-Q9, approximation): the filter (a [Blocker] with 2000 or less power) is read when [When Attacking] resolves, current power; a Blocker pumped later in the same battle stays locked',
  ],
};
