import type { CardScript } from '../../src/dsl.ts';

/** OP14-107 Shakuyaku. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_107: CardScript = {
  cardId: 'OP14-107',
  textHash: '038bce2bc7f32c',
  verified: {
    source: 'cards/overrides/OP14-107.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If your opponent has 3 or less Life, draw 2 and trash 2 from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'opponent',
              },
              '<=',
              3,
            ],
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
                    exactly: 2,
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'If your Leader has the {Kuja Pirates} type, play this card',
      kind: 'trigger',
      effect: [
        {
          if: {
            leader: {
              type: 'Kuja Pirates',
            },
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'self',
                    owner: 'you',
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: ['Reading: "and trash 2 cards" is part of the same gated clause as the draw'],
};
