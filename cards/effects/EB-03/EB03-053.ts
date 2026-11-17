import type { CardScript } from '../../src/dsl.ts';

/** EB03-053 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_053: CardScript = {
  cardId: 'EB03-053',
  textHash: '125e44fc40883e',
  verified: {
    source: 'cards/overrides/EB03-053.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Give up to 1 rested DON!! to your Leader; if your opponent has 3 or more Life, add up to 1 of their top Life cards to their hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: { from: 'leader', owner: 'you' },
            },
          },
        },
        {
          if: { cmp: [{ life: 'opponent' }, '>=', 3] },
          then: [
            {
              do: {
                move: {
                  what: { from: 'lifeTop', owner: 'opponent', pick: { upTo: 1 } },
                  to: { zone: 'hand' },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'on-ko',
      label:
        'Turn 1 Life card face-up: play up to 1 Character with 6000 power or less from your hand',
      kind: 'auto',
      when: ['onKO'],
      cost: [{ turnLifeFaceUp: 1 }],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: { all: [{ category: ['Character'] }, { power: { lte: 6000 } }] },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading: "Then, if your opponent has 3 or more Life" is a separate sentence; it is checked whether or not a DON!! card was given',
    "The Life card goes to its owner (the opponent) hand, not the controller's",
  ],
};
