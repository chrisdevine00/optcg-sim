import type { CardScript } from '../../src/dsl.ts';

/** EB03-049 I Knew You People Were Behind This.. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_049: CardScript = {
  cardId: 'EB03-049',
  textHash: '013b9155d70fc2',
  verified: {
    source: 'cards/overrides/EB03-049.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may rest 7 DON!!: if your Leader is [Perona], play up to 1 {Thriller Bark Pirates} Character with a cost of 6 or less and up to 1 with a cost of 4 or less from your hand or trash',
      kind: 'activate',
      when: 'main',
      cost: [{ restDon: 7 }],
      costOptional: true,
      effect: [
        {
          if: { leader: { name: 'Perona' } },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: ['hand', 'trash'],
                    owner: 'you',
                    filter: {
                      all: [
                        { category: ['Character'] },
                        { type: 'Thriller Bark Pirates' },
                        { cost: { lte: 6 } },
                      ],
                    },
                    pick: { upTo: 1 },
                  },
                },
              },
            },
            {
              do: {
                play: {
                  what: {
                    from: ['hand', 'trash'],
                    owner: 'you',
                    filter: {
                      all: [
                        { category: ['Character'] },
                        { type: 'Thriller Bark Pirates' },
                        { cost: { lte: 4 } },
                      ],
                    },
                    pick: { upTo: 1 },
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
      label: 'Your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: { target: { from: 'leader', owner: 'you' }, amount: 3000, duration: 'battle' },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading (as OP14-084, M6b-Q6): "up to 1 ... and up to 1 ..." is two picks, the cost-6-or-less one first, then the cost-4-or-less one (a cost-4-or-less card may fill either, never both); each from hand or trash',
  ],
};
