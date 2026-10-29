import type { CardScript } from '../../src/dsl.ts';

/** OP17-044 Captain John. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_044: CardScript = {
  cardId: 'OP17-044',
  textHash: '0d5ac2c467a5a3',
  verified: {
    source: 'cards/overrides/OP17-044.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'attack-lock',
      label: 'Your opponent can attack only [Captain John]',
      kind: 'permanent',
      conditions: [
        {
          leader: {
            typeIncludes: 'Rocks Pirates',
          },
        },
        {
          self: {
            state: 'rested',
          },
        },
      ],
      apply: [
        {
          lockAttackTarget: {
            attacker: 'opponent',
            only: {
              from: 'characters',
              owner: 'you',
              filter: {
                name: 'Captain John',
              },
            },
          },
        },
      ],
    },
    {
      id: 'draw-trash',
      label: 'Draw 1 card and trash 1 card from your hand',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'you',
              pick: {
                exactly: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: ['QA-OP17 OP17-044: with two such locks the opponent may attack either card'],
};
