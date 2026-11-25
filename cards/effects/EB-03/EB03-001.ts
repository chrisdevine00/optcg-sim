import type { CardScript } from '../../src/dsl.ts';

/** EB03-001 Nefeltari Vivi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_001: CardScript = {
  cardId: 'EB03-001',
  textHash: '050e0065740c4d',
  verified: {
    source: 'cards/overrides/EB03-001.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'ko-shield',
      label:
        "Once per turn: if your Character with a base cost of 4 or more would be K.O.'d, you may trash 1 card from your hand instead",
      kind: 'replacement',
      oncePerTurn: true,
      replaces: { ko: { from: 'characters', owner: 'you', filter: { baseCost: { gte: 4 } } } },
      optional: true,
      instead: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
    },
    {
      id: 'activate',
      label:
        "You may rest this Leader: give up to 1 of your opponent's Characters -2000 power during this turn; then, up to 1 of your Characters without a [When Attacking] effect gains [Rush] during this turn",
      kind: 'activate',
      when: 'activateMain',
      cost: [{ restSelf: true }],
      effect: [
        {
          do: {
            power: {
              target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            grant: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: { not: { hasTiming: 'whenAttacking' } },
                pick: { upTo: 1 },
              },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (ko-shield): every K.O. of the Character counts (battle, effect), by base cost 4 or more (a cost boost does not matter); a Leader is not a Character; the trash is any 1 card of the hand (not offered with an empty hand); once per turn is spent when the replacement is used',
    'reading (activate): "Then" after an "up to 1" power pick is not "if you do": the Rush step happens even when the power pick chose nothing or the opponent has no Character; a Character "without a [When Attacking] effect" reads the printed text (keywords alone are no effect, an [On Play] is no [When Attacking])',
  ],
};
