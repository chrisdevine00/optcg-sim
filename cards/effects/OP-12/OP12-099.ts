import type { CardScript } from '../../src/dsl.ts';

/** OP12-099 Kalgara. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_099: CardScript = {
  cardId: 'OP12-099',
  textHash: '1983b114eefff0',
  verified: {
    source: 'cards/overrides/OP12-099.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'life-draw',
      label:
        "When a card is removed from your or your opponent's Life cards, draw 1; you cannot draw using your own effects this turn",
      kind: 'auto',
      conditions: [{ yourTurn: true }],
      when: [{ event: 'lifeRemoved', owner: 'any' }],
      effect: [
        { do: { draw: 1 } },
        {
          do: {
            restrict: { target: 'you', what: 'cannotDrawByOwnEffects', duration: 'thisTurn' },
          },
        },
      ],
    },
  ],
  rulings: [
    'Draw-phase draws are not effects, so the restriction never stops them; only your own effects that draw (including a second Kalgara trigger) are stopped for the rest of the turn',
    'Not Once Per Turn on the card; the second removal in a turn simply draws nothing (the draw is barred)',
  ],
};
