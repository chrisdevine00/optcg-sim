import type { CardScript } from '../../src/dsl.ts';

/** EB03-062 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_062: CardScript = {
  cardId: 'EB03-062',
  textHash: '0a9a331c533189',
  verified: {
    source: 'cards/overrides/EB03-062.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Rush'],
  abilities: [
    {
      id: 'main',
      label:
        'Trash 1 card from your hand and trash this Character: add up to 1 card from the top of your deck to the top of your Life; then play up to 1 [Trafalgar Law] with a cost of 7 or less from your hand',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }, { trashSelf: true }],
      effect: [
        {
          do: {
            move: {
              what: { from: 'deckTop', owner: 'you', pick: { upTo: 1 } },
              to: { zone: 'life', position: 'top' },
            },
          },
        },
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { name: 'Trafalgar Law' },
                    { cost: { lte: 7 } },
                  ],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading: "Then, play up to 1 [Trafalgar Law]" is independent of whether a card was added to Life',
    'This Character is trashed as a cost, so it is not in the hand to be replayed; another [Trafalgar Law] of cost 7 or less can be',
  ],
};
