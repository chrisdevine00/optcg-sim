import type { CardScript } from '../../src/dsl.ts';

/** OP17-063 Kaido. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_063: CardScript = {
  cardId: 'OP17-063',
  textHash: '03010a68f9efc7',
  verified: {
    source: 'cards/overrides/OP17-063.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'hand-counter',
      label: 'Character cards in your hand without a Counter have a +1000 Counter',
      kind: 'permanent',
      apply: [
        {
          counter: {
            target: {
              from: 'hand',
              owner: 'you',
              filter: {
                all: [
                  {
                    category: ['Character'],
                  },
                  {
                    hasCounter: false,
                  },
                ],
              },
            },
            value: 1000,
          },
        },
      ],
    },
    {
      id: 'negate-ko',
      label: "Negate up to 1 of your opponent's Characters with a cost of 6 or less, and K.O. it",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          if: {
            self: {
              playedThisTurn: true,
            },
          },
          then: [
            {
              do: {
                negate: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    filter: {
                      cost: {
                        lte: 6,
                      },
                    },
                    pick: {
                      upTo: 1,
                    },
                    bind: 't',
                  },
                  duration: 'thisTurn',
                },
              },
            },
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    ref: 't',
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
    'QA-OP17 OP17-063: only the highest Counter value applies (CR 2-10-4)',
    "E-Q1: the negated Character's [On K.O.] does not activate",
  ],
};
