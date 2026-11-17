import type { CardScript } from '../../src/dsl.ts';

/** OP15-032 Brook. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_032: CardScript = {
  cardId: 'OP15-032',
  textHash: '0529ebb5be6000',
  verified: {
    source: 'cards/overrides/OP15-032.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Rest up to 1 of your opponent's cards",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            rest: {
              from: ['leader', 'characters', 'stage', 'donCostArea'],
              owner: 'opponent',
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
    {
      id: 'reset',
      label:
        'Trash this Character: set up to 1 of your Characters with a base cost of 8 or less as active',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Straw Hat Crew',
            },
          },
          then: [
            {
              do: {
                setActive: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    baseCost: {
                      lte: 8,
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
  rulings: [
    'OPEN-QUESTIONS M4b-1 (reading chosen): "your opponent\'s cards" includes their active DON!! cards, as E-Q3 reads Laboon\'s "your cards"',
    'Read: the Leader condition is an "if" in the effect, so the trash cost is paid even when it is false',
  ],
};
