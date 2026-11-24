import type { CardScript } from '../../src/dsl.ts';

/** EB04-039 Eustass"Captain"Kid. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_039: CardScript = {
  cardId: 'EB04-039',
  textHash: '190d7fee31171d',
  verified: {
    source: 'cards/overrides/EB04-039.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Add up to 1 DON!! active',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'active',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
    {
      id: 'activate',
      label:
        'Trash this Character: play up to 1 {Kid Pirates} Character with cost 5 or less from your hand',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Kid Pirates',
                    },
                    {
                      cost: {
                        lte: 5,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
