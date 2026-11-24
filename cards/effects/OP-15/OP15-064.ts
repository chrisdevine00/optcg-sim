import type { CardScript } from '../../src/dsl.ts';

/** OP15-064 Kotori. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_064: CardScript = {
  cardId: 'OP15-064',
  textHash: '1e66211cea1758',
  verified: {
    source: 'cards/overrides/OP15-064.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rest',
      label:
        "DON!! -2, you may rest this Character: if you have [Satori] and [Hotori], rest up to 1 of your opponent's Characters with 5000 power or less",
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
                    name: 'Satori',
                  },
                },
              },
              {
                exists: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    name: 'Hotori',
                  },
                },
              },
            ],
          },
          then: [
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    power: {
                      lte: 5000,
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
