import type { CardScript } from '../../src/dsl.ts';

/** EB03-016. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_016: CardScript = {
  cardId: 'EB03-016',
  textHash: '1bed87c3ed63ad',
  verified: {
    source: 'cards/overrides/EB03-016.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If your Leader is [Kouzuki Oden], draw 1 card',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              name: 'Kouzuki Oden',
            },
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
          ],
        },
      ],
    },
    {
      id: 'give-don',
      label:
        'You may trash this Character: give up to 1 rested DON!! to your {Land of Wano} Leader',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
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
};
