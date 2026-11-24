import type { CardScript } from '../../src/dsl.ts';

/** OP17-066 Kurozumi Orochi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_066: CardScript = {
  cardId: 'OP17-066',
  textHash: '16ad564b81b80d',
  verified: {
    source: 'cards/overrides/OP17-066.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'DON!! -1: with a Character with a cost of 10 or more, draw 2 cards and trash 1 card from your hand',
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
            exists: {
              from: 'characters',
              owner: 'you',
              filter: {
                cost: {
                  gte: 10,
                },
              },
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
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the "If" follows the DON!! -1 cost, so the cost is paid even when no Character of cost 10 or more is on your field; "draw 2 and trash 1" are one sentence inside the "if"',
  ],
};
