import type { CardScript } from '../../src/dsl.ts';

/** OP14-005 Killer. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_005: CardScript = {
  cardId: 'OP14-005',
  textHash: '0583b67aa43a9d',
  verified: {
    source: 'cards/overrides/OP14-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'give-don',
      label: 'Give up to 1 rested DON!! to your Leader or 1 of your Characters',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
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
    'reading: "up to 1" DON!! with n 1: no count is asked, but the target is a min-0 pick, so once activated the give can be declined (OP14-R4). The target is the Leader or 1 Character (exactly 1)',
  ],
};
