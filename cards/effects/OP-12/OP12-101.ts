import type { CardScript } from '../../src/dsl.ts';

/** OP12-101 Jewelry Bonney. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_101: CardScript = {
  cardId: 'OP12-101',
  textHash: '04341b0a2b6bef',
  verified: {
    source: 'cards/overrides/OP12-101.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'boost',
      label:
        "You may rest this Character: your {Supernovas} type Leader gains +1000 power until the end of your opponent's next turn",
      kind: 'activate',
      when: 'activateMain',
      cost: [{ restSelf: true }],
      effect: [
        {
          do: {
            power: {
              target: { from: 'leader', owner: 'you', filter: { type: 'Supernovas' } },
              amount: 1000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'If your Leader has the {Supernovas} type, play this card',
      kind: 'trigger',
      effect: [
        {
          if: { leader: { type: 'Supernovas' } },
          then: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
        },
      ],
    },
  ],
  rulings: [
    'reading: the quoted "Supernovas" is the exact type; with another Leader the Character is still rested as the cost and the effect does nothing (the target is simply not there)',
    'reading: the [Trigger] "If" has no colon, so it is an effect condition; an activated [Trigger] whose condition fails sends the card to the trash (it is not played and not added to the hand)',
  ],
};
