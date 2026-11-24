import type { CardScript } from '../../src/dsl.ts';

/** EB05-039 Pink Hornet. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_039: CardScript = {
  cardId: 'EB05-039',
  textHash: '0e5a2b776236e1',
  verified: {
    source: 'cards/overrides/EB05-039.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'DON!! -1: with a {The Vinsmoke Family} Leader, give up to 1 opposing Character -4000 power',
      kind: 'activate',
      when: 'main',
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'The Vinsmoke Family',
            },
          },
          then: [
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
                  amount: -4000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'counter',
      label: 'DON!! -1: your Leader gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
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
                from: 'leader',
                owner: 'you',
              },
              amount: 4000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};
