import type { CardScript } from '../../src/dsl.ts';

/** OP14-119 Dracule Mihawk. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_119: CardScript = {
  cardId: 'OP14-119',
  textHash: '1ffc7740d59baa',
  verified: {
    source: 'cards/overrides/OP14-119.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rested',
      label:
        "Your turn: when this Character becomes rested, up to 1 of your opponent's cost 9 or less Characters cannot be rested until the end of your opponent's next End Phase",
      kind: 'auto',
      when: [{ event: 'rested', owner: 'you', filter: { isSelf: true } }],
      conditions: [{ yourTurn: true }],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: { cost: { lte: 9 } },
                pick: { upTo: 1 },
              },
              what: 'cannotBeRested',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
    {
      id: 'opp-attack',
      label:
        'You may trash 1 card from your hand: up to 1 of your Leader or Characters gains +2000 power during this battle',
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          do: {
            power: {
              target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};
