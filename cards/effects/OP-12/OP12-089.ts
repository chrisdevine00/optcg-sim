import type { CardScript } from '../../src/dsl.ts';

/** OP12-089 Hack. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_089: CardScript = {
  cardId: 'OP12-089',
  textHash: '0a0c8da54f106e',
  verified: {
    source: 'cards/overrides/OP12-089.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker-cost',
      label: 'With a Revolutionary Army Leader, this Character gains [Blocker] and +4 cost',
      kind: 'permanent',
      conditions: [
        {
          leader: {
            type: 'Revolutionary Army',
          },
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Blocker',
          },
        },
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 4,
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label:
        "With a Revolutionary Army Leader: K.O. up to 1 of your opponent's Characters with base cost 4 or less",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          if: {
            leader: {
              type: 'Revolutionary Army',
            },
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    baseCost: {
                      lte: 4,
                    },
                  },
                  pick: {
                    upTo: 1,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
