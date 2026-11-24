import type { CardScript } from '../../src/dsl.ts';

/** ST30-009 LittleOars Jr.. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST30_009: CardScript = {
  cardId: 'ST30-009',
  textHash: '19d57a92bd74e1',
  verified: {
    source: 'cards/overrides/ST30-009.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "If your Character with 6000 base power would be removed from the field by your opponent's effect, you may trash this Character and draw 1 card instead",
      kind: 'replacement',
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            basePower: {
              eq: 6000,
            },
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'you',
                filter: {
                  isSelf: true,
                },
                pick: {
                  exactly: 1,
                },
              },
              to: {
                zone: 'trash',
              },
            },
          },
        },
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
  rulings: [
    'G14 reading: the removed Character is any of your Characters with 6000 base power; this card (2000 base) never replaces itself; the draw is part of the replacement',
  ],
};
