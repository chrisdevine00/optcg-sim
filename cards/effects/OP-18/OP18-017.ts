import type { CardScript } from '../../src/dsl.ts';

/** OP18-017 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_017: CardScript = {
  cardId: 'OP18-017',
  textHash: '0c1e61c6c511b1',
  verified: {
    source: 'cards/overrides/OP18-017.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "Once per turn: instead of your {Alabasta} Character being removed by the opponent's effect, you may give your Leader -2000 power this turn",
      kind: 'replacement',
      oncePerTurn: true,
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            type: 'Alabasta',
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'attack',
      label: 'Up to 1 of your {Alabasta} Characters gains [Rush] this turn',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  type: 'Alabasta',
                },
                pick: {
                  upTo: 1,
                },
              },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Q4 proposed reading (m6b-audit OP-18): no "other than this Character", so Zoro covers himself; as OP13-017 the replacement is offered even if the Leader is already low (power can go negative)',
  ],
};
