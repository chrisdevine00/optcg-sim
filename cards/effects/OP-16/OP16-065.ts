import type { CardScript } from '../../src/dsl.ts';

/** OP16-065 Sakazuki. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_065: CardScript = {
  cardId: 'OP16-065',
  textHash: '07e357c841b286',
  verified: {
    source: 'cards/overrides/OP16-065.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "DON!! -1: give up to 1 of your opponent's Characters -6000 power until the end of their next End Phase",
      kind: 'auto',
      when: ['onPlay'],
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
              amount: -6000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
    {
      id: 'ramp',
      label:
        'You may rest 1 DON!!: with a {Navy} Leader, add up to 2 DON!! from your DON!! deck as active',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          restDon: 1,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Navy',
            },
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 2,
                    state: 'active',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'effect-dsl.md §6.5: the rest cost is paid even with a non-Navy Leader (the condition is after the colon)',
  ],
};
