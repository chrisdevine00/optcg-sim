import type { CardScript } from '../../src/dsl.ts';

/** EB02-016 Chopperman. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_016: CardScript = {
  cardId: 'EB02-016',
  textHash: '04299aa0bc6d10',
  verified: {
    source: 'cards/overrides/EB02-016.json (card text in cards/data)',
    date: '2026-11-24',
  },
  rules: [
    {
      alsoNamed: ['Tony Tony.Chopper'],
    },
  ],
  abilities: [
    {
      id: 'on-play',
      label: 'Play up to 1 {Animal} Character with cost 3 or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Animal',
                    },
                    {
                      cost: {
                        lte: 3,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the card is also named [Tony Tony.Chopper] for the rules (deck building and name filters)',
    'reading: "cost of 3 or less" is the printed cost of a card in hand',
  ],
};
