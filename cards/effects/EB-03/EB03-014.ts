import type { CardScript } from '../../src/dsl.ts';

/** EB03-014. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_014: CardScript = {
  cardId: 'EB03-014',
  textHash: '1e79050f156860',
  verified: {
    source: 'cards/overrides/EB03-014.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'give-don',
      label: 'You may rest this Character: give up to 2 rested DON!! to your <Slash> Leader',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              to: {
                from: 'leader',
                owner: 'you',
                filter: {
                  attribute: 'Slash',
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
    'reading: the <Slash> attribute is the Leader\'s printed attribute; with another Leader the cost is paid and nothing is given; "up to 2" asks a count when 2 or more DON!! are rested (as OP14-012)',
  ],
};
