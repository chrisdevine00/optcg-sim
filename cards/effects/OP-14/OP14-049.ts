import type { CardScript } from '../../src/dsl.ts';

/** OP14-049 Jinbe. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_049: CardScript = {
  cardId: 'OP14-049',
  textHash: '0eeaae4319a462',
  verified: {
    source: 'cards/overrides/OP14-049.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush',
      label:
        'When a card is trashed from your hand by an effect, this Character gains [Rush] during this turn',
      kind: 'auto',
      when: [
        {
          event: 'trashedFromHand',
          owner: 'you',
          includeCosts: true,
        },
      ],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'self',
                owner: 'you',
              },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        "You may rest 2 of your DON!! cards: draw 2 cards and return up to 1 Character with a cost of 7 or less to the owner's hand",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          restDon: 2,
        },
      ],
      effect: [
        {
          do: {
            draw: 2,
          },
        },
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 7,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: ['Reading: "Character" in the return is either player\'s, your own included'],
};
