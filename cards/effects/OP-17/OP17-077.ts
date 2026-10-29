import type { CardScript } from '../../src/dsl.ts';

/** OP17-077 Kundali Dragon Swarm. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_077: CardScript = {
  cardId: 'OP17-077',
  textHash: '03933ebd56e6f3',
  verified: {
    source: 'cards/overrides/OP17-077.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'main',
      costOptional: true,
      label: 'Add up to 3 rested DON!!',
      kind: 'activate',
      when: 'main',
      cost: [
        {
          restDon: 3,
        },
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Animal Kingdom Pirates',
            },
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 3,
                    state: 'rested',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      id: 'counter',
      label: 'Your Leader gains +4000 power during this battle',
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
