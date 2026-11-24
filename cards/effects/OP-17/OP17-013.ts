import type { CardScript } from '../../src/dsl.ts';

/** OP17-013 Portgas.D.Ace. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_013: CardScript = {
  cardId: 'OP17-013',
  textHash: '113d807dae398e',
  verified: {
    source: 'cards/overrides/OP17-013.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cheaper',
      label: 'In hand: -2 cost if your opponent has a Character with 10000 power or more',
      kind: 'permanent',
      zone: 'hand',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'opponent',
            filter: {
              power: {
                gte: 10000,
              },
            },
          },
        },
      ],
      apply: [
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: -2,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        "If your Leader is [Edward.Newgate], give up to 1 of your opponent's rested Characters -6000 power during this turn",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              name: 'Edward.Newgate',
            },
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    filter: {
                      state: 'rested',
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: -6000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
