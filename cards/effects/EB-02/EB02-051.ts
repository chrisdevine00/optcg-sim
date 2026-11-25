import type { CardScript } from '../../src/dsl.ts';

/** EB02-051 Three-Pace Hum Soul Notch Slash. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_051: CardScript = {
  cardId: 'EB02-051',
  textHash: '03bc680e1f60b1',
  verified: {
    source: 'cards/overrides/EB02-051.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: 'Choose one: K.O. a cost 2 or less Character; or -4 cost this turn',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          chooseOne: [
            [
              {
                do: {
                  ko: {
                    from: 'characters',
                    owner: 'opponent',
                    filter: {
                      cost: {
                        lte: 2,
                      },
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                },
              },
            ],
            [
              {
                do: {
                  cost: {
                    target: {
                      from: 'characters',
                      owner: 'opponent',
                      pick: {
                        upTo: 1,
                      },
                    },
                    amount: -4,
                    duration: 'thisTurn',
                  },
                },
              },
            ],
          ],
          labels: [
            "K.O. up to 1 of your opponent's Characters with a cost of 2 or less",
            "Give up to 1 of your opponent's Characters -4 cost during this turn",
          ],
        },
      ],
    },
  ],
  rulings: ['Read: the mode is chosen first, then the "up to 1" target of that mode'],
};
