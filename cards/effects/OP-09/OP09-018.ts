import type { CardScript } from '../../src/dsl.ts';

/** OP09-018 Get Out of Here!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_018: CardScript = {
  cardId: 'OP09-018',
  textHash: '018a8951aef093',
  verified: {
    source: 'cards/overrides/OP09-018.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'main',
      label: "[Main] K.O. up to 2 of your opponent's Characters with a total power of 4000 or less",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              pick: { upTo: 2, totalPower: { lte: 4000 } },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "reading: the total is the chosen Characters' current power (a boost or a -power counts, a negative power counts as 0, M6b-Q71); 1 or 2 may be chosen, or none",
  ],
};
