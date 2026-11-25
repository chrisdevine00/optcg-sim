import type { CardScript } from '../../src/dsl.ts';

/** ST23-005 Yasopp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST23_005: CardScript = {
  cardId: 'ST23-005',
  textHash: '0173b91799bcc7',
  verified: {
    source: 'cards/overrides/ST23-005.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'give-don',
      label: 'Once Per Turn: give up to 1 rested DON!! card to your Leader or 1 of your Characters',
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
};
