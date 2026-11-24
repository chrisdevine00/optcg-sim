import type { CardScript } from '../../src/dsl.ts';

/** OP16-022 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_022: CardScript = {
  cardId: 'OP16-022',
  textHash: '128edef0d5092d',
  verified: {
    source: 'cards/overrides/OP16-022.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'set-don',
      label:
        'If the only Characters on your field are {Impel Down} Characters, set up to 2 of your DON!! as active',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      conditions: [
        // "The only Characters are X" is false with no Characters (E-Q4, M6b-Q21; review OP16-R1).
        { exists: { from: 'characters', owner: 'you' } },
        {
          none: {
            from: 'characters',
            owner: 'you',
            filter: {
              not: {
                type: 'Impel Down',
              },
            },
          },
        },
      ],
      effect: [
        {
          do: {
            setActive: {
              from: 'donCostArea',
              owner: 'you',
              pick: {
                upTo: 2,
              },
            },
          },
        },
      ],
    },
  ],
};
