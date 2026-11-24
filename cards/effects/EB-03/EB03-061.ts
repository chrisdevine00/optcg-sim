import type { CardScript } from '../../src/dsl.ts';

/** EB03-061 Uta. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_061: CardScript = {
  cardId: 'EB03-061',
  textHash: '113dd80b3eece0',
  verified: {
    source: 'cards/overrides/EB03-061.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Set up to 1 of your DON!! as active; then rest up to 1 of your opponent's DON!! or Characters with a cost of 4 or less",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        { do: { setActive: { from: 'donCostArea', owner: 'you', pick: { upTo: 1 } } } },
        {
          do: {
            rest: {
              from: ['characters', 'donCostArea'],
              owner: 'opponent',
              filter: { cost: { lte: 4 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
    {
      id: 'end-of-turn',
      label: 'You may rest 1 of your DON!!: set up to 1 of your {FILM} Characters as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      cost: [{ restDon: 1 }],
      effect: [
        {
          do: {
            setActive: {
              from: 'characters',
              owner: 'you',
              filter: { type: 'FILM' },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading: "with a cost of 4 or less" limits the Characters; any DON!! card is a candidate (the filter is not applied to DON!!, as OP12-037)',
  ],
};
