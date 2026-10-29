import type { CardScript } from '../../src/dsl.ts';

/** OP17-054 Miss Buckingham Stussy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_054: CardScript = {
  cardId: 'OP17-054',
  textHash: '1f32e59937437b',
  verified: {
    source: 'cards/overrides/OP17-054.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Up to 1 of your opponent's Characters with a base cost of 6 or less cannot attack",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  baseCost: {
                    lte: 6,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              what: 'cannotAttack',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
    {
      id: 'no-attack',
      label: "Up to 1 of your opponent's Characters cannot attack",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restDon: 3,
        },
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              what: 'cannotAttack',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
};
