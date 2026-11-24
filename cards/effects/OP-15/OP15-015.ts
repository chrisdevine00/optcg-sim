import type { CardScript } from '../../src/dsl.ts';

/** OP15-015 Higuma. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_015: CardScript = {
  cardId: 'OP15-015',
  textHash: '0069143657cd77',
  verified: {
    source: 'cards/overrides/OP15-015.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Give up to 1 of your opponent's rested DON!! cards to 1 of your opponent's Characters; then give -1000 power to up to 1 of your opponent's Characters with a DON!! card given",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              from: 'opponent',
              to: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
            },
          },
        },
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: { donGiven: { gte: 1 } },
                pick: { upTo: 1 },
              },
              amount: -1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then" is a separate step (not "if you do"): the -1000 is chosen among the Characters with a DON!! card given even when none was given just now',
    'reading: the DON!! given is the opponent\'s own rested DON!!; "up to 1" asks the Character, and choosing none gives nothing',
  ],
};
