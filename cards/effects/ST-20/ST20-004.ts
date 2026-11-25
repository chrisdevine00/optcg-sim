import type { CardScript } from '../../src/dsl.ts';

/** ST20-004 Charlotte Pudding. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST20_004: CardScript = {
  cardId: 'ST20-004',
  textHash: '11ddcde70e2f36',
  verified: {
    source: 'cards/overrides/ST20-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may add 1 card from the top of your Life cards to your hand: set up to 1 of your {Big Mom Pirates} Characters with a cost of 3 or less as active',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ lifeToHand: { from: 'top', n: 1 } }],
      effect: [
        {
          do: {
            setActive: {
              from: 'characters',
              owner: 'you',
              filter: { all: [{ type: 'Big Mom Pirates' }, { cost: { lte: 3 } }] },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Rest up to 1 of your opponent's Characters with a cost of 3 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 3 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the setActive target may be Pudding herself (she is a {Big Mom Pirates} Character with cost 3); the cost limit is the current cost; the Life card goes to the hand (not damage, no [Trigger])',
  ],
};
