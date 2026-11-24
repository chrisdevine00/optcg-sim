import type { CardScript } from '../../src/dsl.ts';

/** OP17-069 Jack. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_069: CardScript = {
  cardId: 'OP17-069',
  textHash: '00529c26b258db',
  verified: {
    source: 'cards/overrides/OP17-069.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Rush: Character'],
  abilities: [
    {
      id: 'on-play',
      label:
        "DON!! -1: with an {Animal Kingdom Pirates} Leader, give up to 1 of your opponent's Characters -2000 power during this turn",
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ donMinus: 1 }],
      effect: [
        {
          if: { leader: { type: 'Animal Kingdom Pirates' } },
          then: [
            {
              do: {
                power: {
                  target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
                  amount: -2000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
