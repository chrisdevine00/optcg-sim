import type { CardScript } from '../../src/dsl.ts';

/** EB05-047 Ripley. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_047: CardScript = {
  cardId: 'EB05-047',
  textHash: '1de4b6033f7a68',
  verified: {
    source: 'cards/overrides/EB05-047.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'tall',
      label: 'This Character gains +12 cost',
      kind: 'permanent',
      apply: [
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 12,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'Trash 1 card from your hand: play up to 1 Character with a cost of 2 or less from your trash',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      cost: {
                        lte: 2,
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
  rulings: [
    'RL-43 (as OP17-089): the +12 cost applies only on the field',
    'Reading: the card trashed as the cost is already in the trash and may itself be played if it is a Character with cost 2 or less',
  ],
};
