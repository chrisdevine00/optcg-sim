import type { CardScript } from '../../src/dsl.ts';

/** EB04-014 Kouzuki Sukiyaki. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_014: CardScript = {
  cardId: 'EB04-014',
  textHash: '02c4260a376ec5',
  verified: {
    source: 'cards/overrides/EB04-014.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'give-don',
      label: 'Give up to 1 rested DON!! to your {Land of Wano} Leader',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: 'leader',
                owner: 'you',
                filter: {
                  type: 'Land of Wano',
                },
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (as OP14-005): "up to 1" with n 1 asks no count, but the target is a min-0 pick, so once activated the give can be declined; with a Leader that is not {Land of Wano} nothing happens (the activation is still used)',
  ],
};
