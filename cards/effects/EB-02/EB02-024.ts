import type { CardScript } from '../../src/dsl.ts';

/** EB02-024 Sogeking. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_024: CardScript = {
  cardId: 'EB02-024',
  textHash: '0ce2565e9b3b4b',
  verified: {
    source: 'cards/overrides/EB02-024.json (card text in cards/data)',
    date: '2026-11-24',
  },
  rules: [
    {
      alsoNamed: ['Usopp'],
    },
  ],
  abilities: [
    {
      id: 'on-play',
      label:
        "Draw 2, place 2 cards from your hand at the bottom of your deck in any order; return up to 1 Character with cost 1 or less to the owner's hand",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            draw: 2,
          },
        },
        {
          do: {
            move: {
              what: {
                from: 'hand',
                owner: 'you',
                pick: {
                  exactly: 2,
                },
              },
              to: {
                zone: 'deck',
                position: 'bottom',
              },
            },
          },
        },
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 1,
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
    'reading: the card is also named [Usopp] for the rules',
    'reading: "Then, return up to 1 Character" is a plain Then (no If): it happens whatever the first half did; the Character is any Character on either side (cost 1 or less, current), including this one',
  ],
};
