import type { CardScript } from '../../src/dsl.ts';

/** OP18-021 Franky (Leader). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_021: CardScript = {
  cardId: 'OP18-021',
  textHash: '1a0b4627ca4702',
  verified: {
    source: 'cards/overrides/OP18-021.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'stage-counter',
      label: 'All Stage cards in your hand have a +3000 Counter',
      kind: 'permanent',
      apply: [
        {
          counter: {
            target: { from: 'hand', owner: 'you', filter: { category: ['Stage'] } },
            value: 3000,
          },
        },
      ],
    },
    {
      id: 'play-stage',
      label: 'DON!! −1: play up to 1 Stage card with a cost of 5 or less from your hand',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [{ donMinus: 1 }],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: { all: [{ category: ['Stage'] }, { cost: { lte: 5 } }] },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'OP-18 wave G1: a Stage in hand with a Counter is trashed in the Counter Step like a Character (CR 7-1-3-1-1 names Character cards; the card has no use otherwise)',
    'only the highest Counter value applies (CR 2-10-4)',
  ],
};
