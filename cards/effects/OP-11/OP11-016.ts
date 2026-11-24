import type { CardScript } from '../../src/dsl.ts';

/** OP11-016 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_016: CardScript = {
  cardId: 'OP11-016',
  textHash: '0583b67aa43a9d',
  verified: {
    source: 'cards/overrides/OP11-016.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'give-don',
      label: 'Give up to 1 rested DON!! card to your Leader or 1 of your Characters',
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
    'reading: as OP13-081 and OP14-005: "up to 1" with n 1 asks no count; the DON!! is a rested cost-area DON!! and the effect does nothing without one (the use is spent)',
  ],
};
