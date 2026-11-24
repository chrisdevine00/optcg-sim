import type { CardScript } from '../../src/dsl.ts';

/** OP13-016 Monkey.D.Garp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_016: CardScript = {
  cardId: 'OP13-016',
  textHash: '075508593b0c88',
  verified: {
    source: 'cards/overrides/OP13-016.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'With a Sabo, Ace or Luffy Leader: look at 4; reveal up to 1 card with cost 3+ and add it to your hand',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [
        {
          leader: {
            any: [
              {
                name: 'Sabo',
              },
              {
                name: 'Portgas.D.Ace',
              },
              {
                name: 'Monkey.D.Luffy',
              },
            ],
          },
        },
      ],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 4,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    cost: {
                      gte: 3,
                    },
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
};
