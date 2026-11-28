import type { CardScript } from '../../src/dsl.ts';

/** OP18-066 Zambai. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_066: CardScript = {
  cardId: 'OP18-066',
  textHash: '1b835c00a0c825',
  verified: {
    source: 'cards/overrides/OP18-066.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'rush',
      label:
        'You may K.O. 1 of your Stages with a cost of 5 or less: this Character gains [Rush] during this turn',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          ko: { from: 'stage', owner: 'you', filter: { cost: { lte: 5 } }, pick: { exactly: 1 } },
        },
      ],
      effect: [
        {
          do: {
            grant: {
              target: { from: 'self', owner: 'you' },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'OP-18 wave G2: a K.O. cost may K.O. your own Stage (a real K.O., so "cannot be K.O.\'d" stops it)',
    'reading: no Once Per Turn on the text; [Rush] only matters on the turn this Character was played',
  ],
};
