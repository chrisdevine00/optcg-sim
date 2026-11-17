import type { CardScript } from '../../src/dsl.ts';

/** OP17-017 Ga Ha Ha Ha!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_017: CardScript = {
  cardId: 'OP17-017',
  textHash: '10bbad738412d7',
  verified: {
    source: 'cards/overrides/OP17-017.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'counter',
      label:
        '+2000 power to a Whitebeard Pirates Leader or Character during this battle; then -2000 power to an opposing card',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  typeIncludes: 'Whitebeard Pirates',
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Read: "Then" is not an "if": the -2000 is given even when no card received the +2000',
    'Read: a type "including" Whitebeard Pirates is a substring match of a type element (CR 2-4-3-1)',
  ],
};
