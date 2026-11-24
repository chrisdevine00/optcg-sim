import type { CardScript } from '../../src/dsl.ts';

/** EB05-020 My name is Shirahoshi!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_020: CardScript = {
  cardId: 'EB05-020',
  textHash: '10503fe992ae22',
  verified: {
    source: 'cards/overrides/EB05-020.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: 'You may rest your Leader [Shirahoshi]: draw 2 cards',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          rest: {
            from: 'leader',
            owner: 'you',
            filter: {
              name: 'Shirahoshi',
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 2,
          },
        },
      ],
    },
  ],
  rulings: [
    'DECISIONS 2026-11-09 B-1: an Event worded "You may <cost>:" asks the cost after the card is played and it may be declined; with no active [Shirahoshi] Leader the cost cannot be paid and nothing is drawn',
  ],
};
