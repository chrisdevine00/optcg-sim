import type { CardScript } from '../../src/dsl.ts';

/** OP04-016 Bad Manners Kick Course. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP04_016: CardScript = {
  cardId: 'OP04-016',
  textHash: '0a77d795afb2e8',
  verified: {
    source: 'cards/overrides/OP04-016.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'counter',
      label: 'You may trash 1 card from your hand: +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      costOptional: true,
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        "Give up to 1 of your opponent's Leader or Character cards -3000 power during this turn",
      kind: 'trigger',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -3000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
