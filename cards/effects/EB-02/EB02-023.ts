import type { CardScript } from '../../src/dsl.ts';

/** EB02-023 Crocodile. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_023: CardScript = {
  cardId: 'EB02-023',
  textHash: '0a2bc92427a603',
  verified: {
    source: 'cards/overrides/EB02-023.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'bounced',
      label:
        "Your turn, once per turn: when your effect returns an opponent's Character to the hand, look at 3 and place them at the top or bottom in any order",
      kind: 'auto',
      oncePerTurn: true,
      when: [
        {
          event: 'removed',
          owner: 'opponent',
          filter: {
            category: ['Character'],
          },
          cause: 'yourEffect',
          to: 'hand',
        },
      ],
      conditions: [
        {
          yourTurn: true,
        },
      ],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [],
              rest: 'topOrBottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b-Q20): "returned to the owner\'s hand by your effect" is the opponent\'s Character leaving the field to the hand by an effect of yours (a cost of yours counts as an effect); a K.O. or a return by their own effect does not; one trigger per turn',
    'reading: all three cards go to the top or all to the bottom (topOrBottom is one choice), then in the order picked, as OP11-049',
  ],
};
