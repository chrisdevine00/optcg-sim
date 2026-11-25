import type { CardScript } from '../../src/dsl.ts';

/** ST19-001 Smoker. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST19_001: CardScript = {
  cardId: 'ST19-001',
  textHash: '06b66d77468666',
  verified: {
    source: 'cards/overrides/ST19-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "You may trash 1 black {Navy} card from your hand: up to 2 of your opponent's Characters with a cost of 4 or less cannot attack until the end of your opponent's next turn",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: { all: [{ color: 'Black' }, { type: 'Navy' }] },
            pick: { exactly: 1 },
          },
        },
      ],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: { cost: { lte: 4 } },
                pick: { upTo: 2 },
              },
              what: 'cannotAttack',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "reading: the cost-4 limit is the current cost when the targets are chosen (a snapshot, not re-evaluated); the lock lasts until the end of the opponent's next End Phase; the cost card is any black {Navy} card (Event or Stage included)",
  ],
};
