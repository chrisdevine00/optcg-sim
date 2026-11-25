import type { CardScript } from '../../src/dsl.ts';

/** OP09-058 Special Muggy Ball. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_058: CardScript = {
  cardId: 'OP09-058',
  textHash: '18c9fcbd7c0253',
  verified: {
    source: 'cards/overrides/OP09-058.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "[Main] Your opponent chooses 1 of their Characters with a cost of 6 or less and returns it to the owner's hand",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  cost: {
                    lte: 6,
                  },
                },
                pick: {
                  exactly: 1,
                },
                chooser: 'opponent',
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Return up to 1 Character with a cost of 3 or less to the owner's hand",
      kind: 'trigger',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 3,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "chooses 1 of their Character" is exactly 1 (not "up to"): the opponent must return one when they have an eligible Character, and the choice is theirs; their own Characters of cost 7 or more are not eligible',
    'reading: the [Trigger] may bounce a Character of either player (the text names no owner)',
  ],
};
