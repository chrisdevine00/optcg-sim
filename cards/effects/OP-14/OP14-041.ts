import type { CardScript } from '../../src/dsl.ts';

/** OP14-041 Boa Hancock. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_041: CardScript = {
  cardId: 'OP14-041',
  textHash: '13204199266ace',
  verified: {
    source: 'cards/overrides/OP14-041.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'draw-on-play',
      label: "On your opponent's turn, draw 1 when you play a Character",
      kind: 'auto',
      when: [
        {
          event: 'cardPlayed',
          by: 'you',
          filter: {
            category: ['Character'],
          },
        },
      ],
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
    {
      id: 'ko-life',
      label: "Add up to 1 card from the top of your opponent's Life to its owner's hand",
      kind: 'auto',
      oncePerTurn: true,
      conditions: [
        {
          donGiven: 1,
        },
      ],
      when: [
        {
          event: 'koed',
          filter: {
            all: [
              {
                any: [
                  {
                    type: 'Amazon Lily',
                  },
                  {
                    type: 'Kuja Pirates',
                  },
                ],
              },
              {
                basePower: {
                  gte: 5000,
                },
              },
            ],
          },
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'lifeTop',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'RL-47 / QA-OP14 OP14-041: the draw is mandatory and counts every Character played, including several at once',
    'RL-47: the Life move needs a real K.O. (battle or effect), is not damage (no [Trigger]), and reads base power',
    'koed reads the K.O.d card with printed values (OPEN-QUESTIONS M4b-2)',
  ],
};
