import type { CardScript } from '../../src/dsl.ts';

/** OP12-043 Kuzan. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_043: CardScript = {
  cardId: 'OP12-043',
  textHash: '015aaed918af88',
  verified: {
    source: 'cards/overrides/OP12-043.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cost-bonus',
      label: 'With 5 or more cards in your hand, this Character gains +1 cost',
      kind: 'permanent',
      conditions: [{ cmp: [{ hand: 'you' }, '>=', 5] }],
      apply: [{ cost: { target: { from: 'self', owner: 'you' }, amount: 1 } }],
    },
    {
      id: 'on-play',
      label:
        "You may trash 1 card from your hand: up to 1 of your opponent's Characters cannot attack until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          do: {
            restrict: {
              target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
              what: 'cannotAttack',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
};
