import type { CardScript } from '../../src/dsl.ts';

/** ST22-012 Marco. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST22_012: CardScript = {
  cardId: 'ST22-012',
  textHash: '0a7f1bd2782575',
  verified: {
    source: 'cards/overrides/ST22-012.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "Once Per Turn: if this Character would be K.O.'d by your opponent's effect, you may trash 1 card from your hand instead",
      kind: 'replacement',
      oncePerTurn: true,
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            isSelf: true,
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label:
        'Reveal 1 card from the top of your deck; if its type includes "Whitebeard Pirates", this Character gains +1000 power until the end of your opponent\'s next turn',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            reveal: {
              from: 'deckTop',
              n: 1,
              bind: 'revealed',
            },
          },
        },
        {
          if: {
            ref: 'revealed',
            matches: {
              typeIncludes: 'Whitebeard Pirates',
            },
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: 'self',
                    owner: 'you',
                  },
                  amount: 1000,
                  duration: 'untilEndOfOpponentsNextTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the replacement covers a K.O. by an effect of the opponent only (not battle, not your own effect)',
  ],
};
