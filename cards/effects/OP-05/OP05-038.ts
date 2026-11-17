import type { CardScript } from '../../src/dsl.ts';

/** OP05-038 Charlestone. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP05_038: CardScript = {
  cardId: 'OP05-038',
  textHash: '13f48813cb678e',
  verified: {
    source: 'cards/overrides/OP05-038.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'counter',
      label: '+4000 power; may trash 1 from hand to set up to 3 DON!! active',
      kind: 'activate',
      when: 'counter',
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
              amount: 4000,
              duration: 'battle',
            },
          },
        },
        {
          if: { cmp: [{ hand: 'you' }, '>=', 1] },
          then: [
            {
              may: [
                {
                  do: {
                    trashFromHand: {
                      from: 'hand',
                      owner: 'you',
                      pick: {
                        exactly: 1,
                      },
                    },
                  },
                },
              ],
              label: 'trash',
            },
            {
              ifDid: 'trash',
              then: [
                {
                  do: {
                    setActive: {
                      from: 'donCostArea',
                      owner: 'you',
                      pick: {
                        upTo: 3,
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: "Rest up to 1 of your opponent's Leader or Character cards with a cost of 3 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            rest: {
              from: ['leader', 'characters'],
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 3,
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
  rulings: [
    '"Then, you may trash ... If you do" is part of the effect, not a cost: the DON!! is set active only if a card was trashed',
  ],
};
