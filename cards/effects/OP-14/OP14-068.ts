import type { CardScript } from '../../src/dsl.ts';

/** OP14-068 Trebol. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_068: CardScript = {
  cardId: 'OP14-068',
  textHash: '1701d60ce506a2',
  verified: {
    source: 'cards/overrides/OP14-068.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'don-returned',
      label:
        "Opponent's turn, once per turn: when your DON!! is returned to the DON!! deck, if your Leader has {Donquixote Pirates}, add up to 1 DON!! rested",
      kind: 'auto',
      oncePerTurn: true,
      when: [
        {
          event: 'donReturned',
          owner: 'you',
        },
      ],
      conditions: [
        {
          opponentsTurn: true,
        },
        {
          leader: {
            type: 'Donquixote Pirates',
          },
        },
      ],
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'rested',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: any return of your DON!! counts (your own DON!! -X cost, an effect of either player); the Leader type is checked when the ability triggers',
  ],
};
