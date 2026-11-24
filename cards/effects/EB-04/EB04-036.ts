import type { CardScript } from '../../src/dsl.ts';

/** EB04-036 Foxy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_036: CardScript = {
  cardId: 'EB04-036',
  textHash: '1b1755eaba724b',
  verified: {
    source: 'cards/overrides/EB04-036.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'DON!! -1: with a {Foxy Pirates} Leader draw 2, trash 1, then rest up to 1 opposing Character with cost 9 or less',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Foxy Pirates',
            },
          },
          then: [
            {
              do: {
                draw: 2,
              },
            },
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
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 9,
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
    {
      id: 'activate',
      label: 'Once per turn: add up to 1 DON!! rested',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'rested',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
  ],
};
