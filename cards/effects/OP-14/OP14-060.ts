import type { CardScript } from '../../src/dsl.ts';

/** OP14-060 Donquixote Doflamingo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_060: CardScript = {
  cardId: 'OP14-060',
  textHash: '1a41f2442fb3c6',
  verified: {
    source: 'cards/overrides/OP14-060.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'redirect',
      label:
        "[On Your Opponent's Attack] [Once Per Turn] DON!! -1: select your Leader or 1 of your {Donquixote Pirates} Characters; change the attack target to it",
      kind: 'auto',
      oncePerTurn: true,
      when: ['onOpponentAttack'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            redirectAttack: {
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  any: [
                    {
                      category: ['Leader'],
                    },
                    {
                      type: 'Donquixote Pirates',
                    },
                  ],
                },
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "reading (D3, M6b-Q85, QA-OP12 OP12-020, QA-OP16 OP16-080): the new target may be active or rested and may be the card already attacked; an attack redirected to a Leader is an attack on a Leader; [On Your Opponent's Attack] is read once, so it does not fire again",
    'reading: "select" is a choice made on resolution, after the DON!! -1 is paid; {Donquixote Pirates} is the exact type',
  ],
};
