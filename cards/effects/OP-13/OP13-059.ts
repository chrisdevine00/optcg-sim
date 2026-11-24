import type { CardScript } from '../../src/dsl.ts';

/** OP13-059 Brilliant Punk. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_059: CardScript = {
  cardId: 'OP13-059',
  textHash: '14bb046d14b507',
  verified: {
    source: 'cards/overrides/OP13-059.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may return 1 of your Characters to the owner's hand: return up to 1 Character with a cost of 6 or less to the owner's hand",
      kind: 'activate',
      when: 'main',
      cost: [
        {
          move: {
            from: 'characters',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
          to: {
            zone: 'hand',
          },
        },
      ],
      costOptional: true,
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 6,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
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
    'reading: the target is any Character on either field ("up to 1 Character"), read by current cost, inclusive at 6; the Character returned as the cost is already gone, so it cannot be the target',
    'DECISIONS 2026-11-09 B-1: an Event worded "You may <cost>:" asks the cost after the card is played and it may be declined',
  ],
};
