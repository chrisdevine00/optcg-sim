import type { CardScript } from '../../src/dsl.ts';

/** OP09-059 Murder at the Steam Bath. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_059: CardScript = {
  cardId: 'OP09-059',
  textHash: '1c9a5d91863903',
  verified: {
    source: 'cards/overrides/OP09-059.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        '[Counter] Up to 1 of your Leader or Character cards gains +3000 power this battle; then trash up to 2 cards from your hand and the same number from the top of your deck',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'you',
              pick: {
                upTo: 2,
              },
              bind: 'trashed',
            },
          },
        },
        {
          do: {
            mill: {
              player: 'you',
              n: {
                refCount: 'trashed',
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 1 card',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "the same number as you did from your hand" is the number of cards actually trashed (0 to 2): trashing none trashes none from the deck; a deck with fewer cards trashes as many as it holds',
    'reading: "Then" is not "If you do": the hand trash is asked even when no card was given the +3000',
  ],
};
