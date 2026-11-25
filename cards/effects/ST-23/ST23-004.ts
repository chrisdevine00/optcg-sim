import type { CardScript } from '../../src/dsl.ts';

/** ST23-004 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST23_004: CardScript = {
  cardId: 'ST23-004',
  textHash: '0f7ce4b2d363ae',
  verified: {
    source: 'cards/overrides/ST23-004.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'shrink',
      label:
        "You may rest 1 of your DON!! cards and this Character: give up to 1 of your opponent's Characters -1000 power during this turn",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restDon: 1,
        },
        {
          restSelf: true,
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
              amount: -1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
