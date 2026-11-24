import type { CardScript } from '../../src/dsl.ts';

/** OP12-013 Hatchan. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_013: CardScript = {
  cardId: 'OP12-013',
  textHash: '10825a92751da5',
  verified: {
    source: 'cards/overrides/OP12-013.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'Rest this Character and reveal 2 Events: give up to 2 rested DON!! to your Leader or 1 Character',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              category: ['Event'],
            },
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
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
    'Read: "up to 2" asks a count (None, 1 or 2), then one target among the Leader and Characters',
  ],
};
