import type { CardScript } from '../../src/dsl.ts';

/** OP10-103 Capone"Gang"Bege. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_103: CardScript = {
  cardId: 'OP10-103',
  textHash: '153a5262f9e266',
  verified: {
    source: 'cards/overrides/OP10-103.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Add 1 card from the top or bottom of your Life cards to your hand: add up to 1 Supernovas Character from your hand to the top of your Life cards face-up',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          lifeToHand: {
            from: 'topOrBottom',
            n: 1,
          },
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Supernovas',
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'life',
                position: 'top',
                faceUp: true,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the card just added to the hand from Life may itself be the Supernovas Character put back on top (it is in the hand when the effect resolves)',
  ],
};
