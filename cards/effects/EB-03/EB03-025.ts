import type { CardScript } from '../../src/dsl.ts';

/** EB03-025. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_025: CardScript = {
  cardId: 'EB03-025',
  textHash: '1999211bb10de2',
  verified: {
    source: 'cards/overrides/EB03-025.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "You may trash 1 card from your hand: return up to 1 Character with 6000 base power to the owner's hand",
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
                owner: 'any',
                filter: {
                  basePower: {
                    eq: 6000,
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
    'reading: "a Character with 6000 base power" is exactly 6000 base power on either side, this Hina included (6000); it goes to its owner\'s hand',
  ],
};
