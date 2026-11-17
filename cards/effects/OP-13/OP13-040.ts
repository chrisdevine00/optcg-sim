import type { CardScript } from '../../src/dsl.ts';

/** OP13-040 I Know You're Strong... So I'll Go All Out from the Very Start!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_040: CardScript = {
  cardId: 'OP13-040',
  textHash: '1ca4f4d71a41be',
  verified: {
    source: 'cards/overrides/OP13-040.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may rest 2 DON!!: up to 2 rested opposing Characters with cost 7 or less will not become active',
      kind: 'activate',
      when: 'main',
      cost: [
        {
          restDon: 2,
        },
      ],
      costOptional: true,
      effect: [
        {
          do: {
            skipRefresh: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                all: [
                  {
                    state: 'rested',
                  },
                  {
                    cost: {
                      lte: 7,
                    },
                  },
                ],
              },
              pick: {
                upTo: 2,
              },
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label: 'Your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'DECISIONS 2026-11-09 B-1: an Event worded "You may <cost>:" asks the cost after the card is played and it may be declined',
    "DECISIONS 2026-11-16 G26: skipRefresh lasts through the opponent's next Refresh Phase only (afterRefresh)",
  ],
};
