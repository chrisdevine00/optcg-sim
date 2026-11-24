import type { CardScript } from '../../src/dsl.ts';

/** OP13-114 S-Snake. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_114: CardScript = {
  cardId: 'OP13-114',
  textHash: '0dbedac3257b4c',
  verified: {
    source: 'cards/overrides/OP13-114.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'power',
      label: "Turn 1 Life face-up: give up to 1 of opponent's Characters -2000 power this turn",
      kind: 'auto',
      when: ['onPlay', 'whenAttacking'],
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
    {
      id: 'trigger',
      label: 'Trash 1 from hand: play this card',
      kind: 'trigger',
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'self',
                owner: 'you',
              },
            },
          },
        },
      ],
    },
  ],
};
