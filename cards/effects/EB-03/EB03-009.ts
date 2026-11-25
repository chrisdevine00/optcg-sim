import type { CardScript } from '../../src/dsl.ts';

/** EB03-009 Makino. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_009: CardScript = {
  cardId: 'EB03-009',
  textHash: '174b15b58f134a',
  verified: {
    source: 'cards/overrides/EB03-009.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'You may rest this Character: up to 1 of your Characters with no base effect gains +2000 power during this turn',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ restSelf: true }],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: { hasBaseEffect: false },
                pick: { upTo: 1 },
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: Makino has a base effect herself, so she can never be the target; the pick is "up to 1" over the Characters whose printed text is empty or only keywords',
  ],
};
