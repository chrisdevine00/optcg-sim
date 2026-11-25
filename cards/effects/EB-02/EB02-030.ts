import type { CardScript } from '../../src/dsl.ts';

/** EB02-030 And That's When Somebody Makes Fun of Their Friend's Dream!!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_030: CardScript = {
  cardId: 'EB02-030',
  textHash: '01438f64030104',
  verified: {
    source: 'cards/overrides/EB02-030.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'counter',
      label:
        "If any of your Characters would be K.O.'d in battle during this turn, you may trash 1 card from your hand instead",
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            addReplacement: {
              replaces: { ko: { from: 'characters', owner: 'you' }, cause: 'battle' },
              optional: true,
              instead: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 1 card',
      kind: 'trigger',
      effect: [{ do: { draw: 1 } }],
    },
  ],
  rulings: [
    "reading (M6b-Q54): the replacement lasts to the end of the turn and is offered for every Character of yours that would be K.O.'d in battle, each time, not only the first; each acceptance trashes 1 more card from the hand",
    'reading: "any of your Characters" is every Character on your field when the K.O. happens, including one played after the Event; your Leader is not a Character and is not covered',
  ],
};
