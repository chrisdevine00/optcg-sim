import type { CardScript } from '../../src/dsl.ts';

/** EB05-040 You Need Me, Don't You?!!♡. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_040: CardScript = {
  cardId: 'EB05-040',
  textHash: '0e85144feced19',
  verified: {
    source: 'cards/overrides/EB05-040.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'May return 1 active DON!! to the DON!! deck: with a {Donquixote Pirates} Leader, draw 3 and trash 1',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          returnDon: {
            n: 1,
            state: 'active',
          },
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Donquixote Pirates',
            },
          },
          then: [
            {
              do: {
                draw: 3,
              },
            },
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'you',
                  pick: {
                    exactly: 1,
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'counter',
      label: 'Your Leader gains +2000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};
