import type { CardScript } from '../../src/dsl.ts';

/** OP12-001 Silvers Rayleigh. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_001: CardScript = {
  cardId: 'OP12-001',
  textHash: '099ab307af9bc8',
  verified: {
    source: 'cards/overrides/OP12-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  rules: [
    {
      deckRestriction: {
        cost: {
          gte: 5,
        },
      },
    },
  ],
  abilities: [
    {
      id: 'activate',
      label: 'Reveal 2 Events: up to 1 Character with 4000 base power or less gains +2000 power',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              category: ['Event'],
            },
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  basePower: {
                    lte: 4000,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Rules text: "you cannot include cards with a cost of 5 or more in your deck" is a deckRestriction of cost >= 5 over printed values; the Leader (no cost) is not affected',
    'Read: "base power" is the printed power, so a Character already boosted above 4000 does not qualify but one boosted from a lower base still does',
  ],
};
