import type { CardScript } from '../../src/dsl.ts';

/** OP05-077 Gamma Knife. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP05_077: CardScript = {
  cardId: 'OP05-077',
  textHash: '01f45f47483101',
  verified: {
    source: 'cards/overrides/OP05-077.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label: "DON!! -1: give up to 1 of your opponent's Characters -5000 power during this turn",
      kind: 'activate',
      when: 'main',
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
              amount: -5000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Add up to 1 DON!! card from your DON!! deck and set it as active',
      kind: 'trigger',
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'active',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
  ],
};
