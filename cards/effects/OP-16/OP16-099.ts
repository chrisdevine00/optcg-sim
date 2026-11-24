import type { CardScript } from '../../src/dsl.ts';

/** OP16-099 I've Come Here... To Cut Those Chains!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_099: CardScript = {
  cardId: 'OP16-099',
  textHash: '03a1aed611e8df',
  verified: {
    source: 'cards/overrides/OP16-099.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Rest 6 DON!!: trash 5 from the top of your deck, then play a {Land of Wano} Character (cost 6 or less) from your trash',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [{ restDon: 6 }],
      effect: [
        { do: { mill: { player: 'you', n: 5 } } },
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { type: 'Land of Wano' },
                    { cost: { lte: 6 } },
                  ],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label: 'Your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: { target: { from: 'leader', owner: 'you' }, amount: 3000, duration: 'battle' },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the played card is chosen after the 5 cards are trashed, so a milled {Land of Wano} Character can be played; "Then" is not "If you do"',
  ],
};
