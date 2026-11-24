import type { CardScript } from '../../src/dsl.ts';

/** OP14-056 Wadatsumi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_056: CardScript = {
  cardId: 'OP14-056',
  textHash: '1cef944d8b558f',
  verified: {
    source: 'cards/overrides/OP14-056.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'no-attack',
      label: 'This Character cannot attack',
      kind: 'permanent',
      apply: [
        {
          restrict: {
            target: {
              from: 'self',
              owner: 'you',
            },
            what: 'cannotAttack',
          },
        },
      ],
    },
    {
      id: 'negated',
      label:
        "When a card is trashed from your hand by an effect, this Character's effect is negated during this turn",
      kind: 'auto',
      when: [
        {
          event: 'trashedFromHand',
          owner: 'you',
        },
      ],
      effect: [
        {
          do: {
            negate: {
              target: {
                from: 'self',
                owner: 'you',
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading (M6b-Q11): any effect of either player; negating this Character also removes "cannot attack" for the turn',
  ],
};
