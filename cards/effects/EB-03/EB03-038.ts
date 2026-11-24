import type { CardScript } from '../../src/dsl.ts';

/** EB03-038 Thanks for the Treat. ♡. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_038: CardScript = {
  cardId: 'EB03-038',
  textHash: '13777a04642f45',
  verified: {
    source: 'cards/overrides/EB03-038.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may rest 1 DON!!: if you have as few DON!! as your opponent or fewer and only GERMA Characters, add up to 2 DON!! and rest them',
      kind: 'activate',
      when: 'main',
      cost: [{ restDon: 1 }],
      costOptional: true,
      effect: [
        {
          if: {
            all: [
              { cmp: [{ donOnField: 'you' }, '<=', { donOnField: 'opponent' }] },
              { exists: { from: 'characters', owner: 'you' } },
              {
                none: {
                  from: 'characters',
                  owner: 'you',
                  filter: { not: { typeIncludes: 'GERMA' } },
                },
              },
            ],
          },
          then: [{ do: { addDon: [{ n: 2, state: 'rested', upTo: true }] } }],
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
    'Reading (as OP13-095): "you only have Characters with a type including GERMA" is false with no Characters',
  ],
};
