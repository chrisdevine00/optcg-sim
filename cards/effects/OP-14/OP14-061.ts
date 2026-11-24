import type { CardScript } from '../../src/dsl.ts';

/** OP14-061 Vergo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_061: CardScript = {
  cardId: 'OP14-061',
  textHash: '1b16abebb7566f',
  verified: {
    source: 'cards/overrides/OP14-061.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "Once Per Turn: if your {Donquixote Pirates} Character would be removed from the field by your opponent's effect, you may return 1 DON!! from your field to your DON!! deck instead",
      kind: 'replacement',
      oncePerTurn: true,
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            type: 'Donquixote Pirates',
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          returnDon: 1,
        },
      ],
    },
    {
      id: 'attack',
      label: "DON!! -1: give up to 1 of your opponent's Characters -2000 power during this turn",
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
