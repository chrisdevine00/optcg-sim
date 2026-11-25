import type { CardScript } from '../../src/dsl.ts';

/** OP09-060 Emptee Bluffs Island. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_060: CardScript = {
  cardId: 'OP09-060',
  textHash: '107eb0b300b536',
  verified: {
    source: 'cards/overrides/OP09-060.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'Place 2 cards from your hand at the bottom of your deck in any order and rest this Stage: with a Cross Guild Leader, draw 2 cards',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          move: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 2,
            },
          },
          to: {
            zone: 'deck',
            position: 'bottom',
          },
        },
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Cross Guild',
            },
          },
          then: [
            {
              do: {
                draw: 2,
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the "If" is after the cost colon, so it is an effect condition: with another Leader the cost is paid and nothing is drawn; the cost needs 2 cards in hand',
  ],
};
