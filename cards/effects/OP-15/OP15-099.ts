import type { CardScript } from '../../src/dsl.ts';

/** OP15-099 Urouge. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_099: CardScript = {
  cardId: 'OP15-099',
  textHash: '1aa7621277fda4',
  verified: {
    source: 'cards/overrides/OP15-099.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may trash 1 {Supernovas} type card from your hand: this Character gains [Rush] during this turn',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: { type: 'Supernovas' },
            pick: { exactly: 1 },
          },
        },
      ],
      effect: [
        {
          do: {
            grant: {
              target: { from: 'self', owner: 'you' },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'give-don',
      label:
        'You may turn 1 card from the top of your Life cards face-down: give up to 1 rested DON!! card to your Leader or 1 of your Characters',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ turnLifeFaceDown: { n: 1, from: 'top' } }],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the quoted "Supernovas" is the exact type of the card trashed from the hand (a Supernovas card of any category, Urouge himself is in play so he is not a candidate); the [Rush] is for this turn only',
    'reading (G68): the cost turns the top Life card face-down and needs that card to be face-up; a face-down top card makes the cost unpayable (the bottom card is not used); "give up to 1" is the Leader or Character pick with upTo 1, so it may be declined after the cost is paid (as OP13-005)',
  ],
};
