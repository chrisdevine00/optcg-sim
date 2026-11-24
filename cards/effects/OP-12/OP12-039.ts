import type { CardScript } from '../../src/dsl.ts';

/** OP12-039 Luffy Is the Man Who Will Become the King of Pirates!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_039: CardScript = {
  cardId: 'OP12-039',
  textHash: '13a692eb2283a2',
  verified: {
    source: 'cards/overrides/OP12-039.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: 'Set your [Roronoa Zoro] Leader as active',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            setActive: {
              from: 'leader',
              owner: 'you',
              filter: {
                name: 'Roronoa Zoro',
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Up to 1 of your Leader or Character cards gains +1000 power',
      kind: 'trigger',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
