import type { CardScript } from '../../src/dsl.ts';

/** EB02-021 Gum-Gum Giant Pistol. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_021: CardScript = {
  cardId: 'EB02-021',
  textHash: '1b55c18aeb2434',
  verified: {
    source: 'cards/overrides/EB02-021.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label:
        'A {Straw Hat Crew} Character gains +6000 power this turn; it will not become active in your next Refresh Phase',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  type: 'Straw Hat Crew',
                },
                pick: {
                  upTo: 1,
                },
                bind: 'chosen',
              },
              amount: 6000,
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            skipRefresh: {
              from: 'characters',
              owner: 'you',
              filter: {
                ref: 'chosen',
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Rest up to 1 of your opponent's Characters with a cost of 4 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 4,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Read: "the selected Character" is the one chosen for the +6000; with none chosen nothing skips the Refresh Phase',
    "DECISIONS 2026-11-16 G26: skipRefresh runs out right after the owner's next Refresh Phase untap",
  ],
};
