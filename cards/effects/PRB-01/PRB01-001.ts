import type { CardScript } from '../../src/dsl.ts';

/** PRB01-001 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB01_001: CardScript = {
  cardId: 'PRB01-001',
  textHash: '0b28157e1d9426',
  verified: {
    source: 'cards/overrides/PRB01-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush',
      label:
        'Up to 1 of your Characters without an [On Play] effect and with a cost of 8 or less gains [Rush] during this turn',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: { all: [{ not: { hasTiming: 'onPlay' } }, { cost: { lte: 8 } }] },
                pick: { upTo: 1 },
              },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (G49, M6b-Q70): "without an [On Play] effect" reads the printed text: a Character with another timing, a [Trigger] or only keywords has no [On Play] effect; one whose [On Play] is printed has one even if it is negated or its script is missing; a bracket followed by the word "effect" in a card\'s text does not print a timing',
    'reading: the cost is the current cost, at 8 or less inclusive',
  ],
};
