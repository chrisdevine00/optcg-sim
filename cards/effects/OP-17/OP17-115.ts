import type { CardScript } from '../../src/dsl.ts';

/** OP17-115 Code of honor Event. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_115: CardScript = {
  cardId: 'OP17-115',
  textHash: '19f496c7ab3734',
  verified: {
    source: 'cards/overrides/OP17-115.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: 'Your [Charlotte Linlin] Leader gains [Unblockable] during this turn',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            grant: {
              target: { from: 'leader', owner: 'you', filter: { name: 'Charlotte Linlin' } },
              keyword: 'Unblockable',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label: 'Up to 1 of your [Charlotte Linlin] gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { name: 'Charlotte Linlin' },
                pick: { upTo: 1 },
              },
              amount: 4000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'review EB05-R1 family: the [Main] has no "up to", so the Unblockable grant is mandatory (no pick); with no [Charlotte Linlin] Leader nothing is granted',
    'reading: "[Charlotte Linlin]" in the [Counter] is any of your Leader or Characters with that name (no zone given in the text)',
  ],
};
