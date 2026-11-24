import type { CardScript } from '../../src/dsl.ts';

/** OP16-071 Benevolent King of the Waves. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_071: CardScript = {
  cardId: 'OP16-071',
  textHash: '1ba7dc61529a7f',
  verified: {
    source: 'cards/overrides/OP16-071.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Trash 1 card from your hand: add up to 1 rested DON!!',
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
    {
      id: 'on-ko',
      label: 'Add up to 1 rested DON!!',
      kind: 'auto',
      when: ['onKO'],
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
