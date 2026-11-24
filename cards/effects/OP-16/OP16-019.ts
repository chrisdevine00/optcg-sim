import type { CardScript } from '../../src/dsl.ts';

/** OP16-019 Let's Show 'Em What We're Made Of!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_019: CardScript = {
  cardId: 'OP16-019',
  textHash: '16ec599d4c5b25',
  verified: {
    source: 'cards/overrides/OP16-019.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Play up to 2 Character cards with a Whitebeard Pirates type and 8000 power from your hand',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      typeIncludes: 'Whitebeard Pirates',
                    },
                    {
                      power: {
                        eq: 8000,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 2,
                },
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Your Leader gains +1000 power during this turn',
      kind: 'trigger',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
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
