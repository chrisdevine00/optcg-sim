import type { CardScript } from '../../src/dsl.ts';

/** OP16-052 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_052: CardScript = {
  cardId: 'OP16-052',
  textHash: '0173b91799bcc7',
  verified: {
    source: 'cards/overrides/OP16-052.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'give',
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
};
