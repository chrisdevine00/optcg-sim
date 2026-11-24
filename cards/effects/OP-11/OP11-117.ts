import type { CardScript } from '../../src/dsl.ts';

/** OP11-117 Fish-Man Island. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_117: CardScript = {
  cardId: 'OP11-117',
  textHash: '047e8878493fd4',
  verified: {
    source: 'cards/overrides/OP11-117.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'If your Leader is [Shirahoshi], you may turn 1 Life card face-up: up to 1 of your "Neptunian", "Fish-Man" or "Merfolk" Characters gains +1000 power during this turn',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      conditions: [
        {
          leader: {
            name: 'Shirahoshi',
          },
        },
      ],
      cost: [
        {
          turnLifeFaceUp: 1,
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
                  any: [
                    {
                      type: 'Neptunian',
                    },
                    {
                      type: 'Fish-Man',
                    },
                    {
                      type: 'Merfolk',
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
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
