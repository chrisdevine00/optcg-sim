import type { CardScript } from '../../src/dsl.ts';

/** ST22-005 Kouzuki Oden. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST22_005: CardScript = {
  cardId: 'ST22-005',
  textHash: '1d1e347c53d2a5',
  verified: {
    source: 'cards/overrides/ST22-005.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "If this Character would be removed from the field by your opponent's effect, you may trash 2 cards from your hand instead",
      kind: 'replacement',
      replaces: {
        leaveField: {
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
              exactly: 2,
            },
          },
        },
      ],
    },
    {
      id: 'untap',
      label:
        'Once Per Turn, rest 3 DON!! and return 1 of your other Characters to your hand: set this Character as active',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          restDon: 3,
        },
        {
          move: {
            from: 'characters',
            owner: 'you',
            filter: {
              isSelf: false,
            },
            pick: {
              exactly: 1,
            },
          },
          to: {
            zone: 'hand',
          },
        },
      ],
      effect: [
        {
          do: {
            setActive: {
              from: 'self',
              owner: 'you',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "removed from the field by your opponent\'s effect" includes a K.O. by that effect (QA-OP02 OP02-027 reads "removed" as K.O., trash, hand and deck moves); not a battle K.O. and not the owner\'s own effect',
    'reading: with fewer than 2 cards in hand the replacement cannot be paid',
  ],
};
