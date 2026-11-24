import type { CardScript } from '../../src/dsl.ts';

/** OP17-041 Wang Zhi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_041: CardScript = {
  cardId: 'OP17-041',
  textHash: '0bd17713d7846d',
  verified: {
    source: 'cards/overrides/OP17-041.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        "You may trash 1 card from your hand: place all of your opponent's Characters with a base cost of 1 at the bottom of the owner's deck",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  baseCost: {
                    eq: 1,
                  },
                },
              },
              to: {
                zone: 'deck',
                position: 'bottom',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "in any order of the owner\'s choosing" is the order the cards are placed in (DECISIONS 2026-11-16, bottom placement); the base cost filter reads the printed cost',
  ],
};
