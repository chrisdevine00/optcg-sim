import type { CardScript } from '../../src/dsl.ts';

/** OP15-026 Jango. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_026: CardScript = {
  cardId: 'OP15-026',
  textHash: '09c0442d9874a2',
  verified: {
    source: 'cards/overrides/OP15-026.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 3 cards; reveal up to 1 {East Blue} card and add it to your hand; the rest to the bottom of your deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [
                { pick: { upTo: 1 }, filter: { type: 'East Blue' }, reveal: true, to: 'hand' },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
    {
      id: 'give-don',
      label:
        "You may trash this Character: give up to 1 of your opponent's rested DON!! to 1 of their Characters",
      kind: 'activate',
      when: 'activateMain',
      cost: [{ trashSelf: true }],
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
      ],
    },
  ],
  rulings: [
    "reading (M6b-Q24): the rested DON!! is the opponent's own, given to one of their Characters (not their Leader)",
  ],
};
