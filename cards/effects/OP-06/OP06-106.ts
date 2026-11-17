import type { CardScript } from '../../src/dsl.ts';

/** OP06-106 Kouzuki Hiyori. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP06_106: CardScript = {
  cardId: 'OP06-106',
  textHash: '1cac5d02ff8081',
  verified: {
    source: 'cards/overrides/OP06-106.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Add 1 Life card (top or bottom) to your hand: add up to 1 card from your hand to the top of your Life',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          lifeToHand: {
            from: 'topOrBottom',
            n: 1,
          },
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'hand',
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'life',
                position: 'top',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'QA-GR: adding a Life card to the hand is not damage, so no [Trigger]; the cost needs at least 1 Life card',
  ],
};
