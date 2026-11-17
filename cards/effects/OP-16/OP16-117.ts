import type { CardScript } from '../../src/dsl.ts';

/** OP16-117 Black Hole. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_117: CardScript = {
  cardId: 'OP16-117',
  textHash: '1cd175b77b8a39',
  verified: {
    source: 'cards/overrides/OP16-117.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Trash 1 card with a [Trigger]: negate an opponent's Character with a cost of 8 or less",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              hasTrigger: true,
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            negate: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  cost: {
                    lte: 8,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Add up to 1 {Blackbeard Pirates} card from your trash to your hand',
      kind: 'trigger',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  type: 'Blackbeard Pirates',
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
};
