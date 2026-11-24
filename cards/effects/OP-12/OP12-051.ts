import type { CardScript } from '../../src/dsl.ts';

/** OP12-051 Hina. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_051: CardScript = {
  cardId: 'OP12-051',
  textHash: '12d9f7a9541cfc',
  verified: {
    source: 'cards/overrides/OP12-051.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'no-blocker',
      label:
        "You may rest this Character and trash 1 card from your hand: up to 1 of your opponent's Characters with a base cost of 4 or less cannot activate [Blocker] during this turn",
      kind: 'activate',
      when: 'activateMain',
      cost: [{ restSelf: true }, { trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: { baseCost: { lte: 4 } },
                pick: { upTo: 1 },
              },
              what: 'cannotActivateBlocker',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading: the lock covers a [Blocker] gained as well as printed (the Character cannot activate [Blocker] at all this turn); base cost is the printed cost',
  ],
};
