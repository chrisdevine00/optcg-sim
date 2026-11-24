import type { CardScript } from '../../src/dsl.ts';

/** EB03-021. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_021: CardScript = {
  cardId: 'EB03-021',
  textHash: '10badc50a12503',
  verified: {
    source: 'cards/overrides/EB03-021.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "You may trash 1 card from your hand: place up to 1 of your opponent's Characters with 4000 base power or less and up to 1 Character with a base cost of 3 or less at the bottom of the owner's deck",
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
                  basePower: {
                    lte: 4000,
                  },
                },
                pick: {
                  upTo: 1,
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
                  baseCost: {
                    lte: 3,
                  },
                },
                pick: {
                  upTo: 1,
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
    "reading: the second \"up to 1 Character\" is any Character on either side (not only the opponent's), including one of yours; the two picks are separate, the 4000-base-power one first, so a Character that fits both can be taken by either but never twice. Each goes to its owner's deck bottom (one card per deck, so no order question unless both are the same owner's)",
  ],
};
