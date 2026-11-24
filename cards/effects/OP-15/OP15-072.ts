import type { CardScript } from '../../src/dsl.ts';

/** OP15-072 Hotori. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_072: CardScript = {
  cardId: 'OP15-072',
  textHash: '15b481aefb9e2b',
  verified: {
    source: 'cards/overrides/OP15-072.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'weaken',
      label:
        "DON!! -2, you may rest this Character: if you have [Kotori] and [Satori], give up to 1 of your opponent's Characters -3000 power during this turn",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          donMinus: 2,
        },
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          if: {
            all: [
              {
                exists: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    name: 'Kotori',
                  },
                },
              },
              {
                exists: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    name: 'Satori',
                  },
                },
              },
            ],
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: 'characters',
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
    },
  ],
};
