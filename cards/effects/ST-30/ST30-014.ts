import type { CardScript } from '../../src/dsl.ts';

/** ST30-014 Mr.3(Galdino). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST30_014: CardScript = {
  cardId: 'ST30-014',
  textHash: '117a74d812e2b9',
  verified: {
    source: 'cards/overrides/ST30-014.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'give',
      label:
        'You may rest this Character: give up to 2 of your Characters with 6000 base power up to 2 rested DON!! cards each',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              to: {
                from: 'characters',
                owner: 'you',
                filter: {
                  basePower: {
                    eq: 6000,
                  },
                },
                pick: {
                  upTo: 2,
                },
              },
              each: true,
            },
          },
        },
      ],
    },
  ],
  rulings: ['G16 reading: the DON!! are the rested cost-area DON!!; the given cards stay rested'],
};
