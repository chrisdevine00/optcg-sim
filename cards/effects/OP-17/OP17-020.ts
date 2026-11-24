import type { CardScript } from '../../src/dsl.ts';

/** OP17-020 Shanks. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_020: CardScript = {
  cardId: 'OP17-020',
  textHash: '06dfe1c54f667c',
  verified: {
    source: 'cards/overrides/OP17-020.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'hold',
      label:
        "You may trash 1 card from your hand or rest 1 of your DON!! cards: up to 1 of your opponent's rested Characters will not become active in your opponent's next Refresh Phase",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          oneOf: [
            [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
            [{ restDon: 1 }],
          ],
        },
      ],
      effect: [
        {
          do: {
            skipRefresh: {
              from: 'characters',
              owner: 'opponent',
              filter: { state: 'rested' },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'G19: "A or B" is a oneOf cost; only a payable alternative is offered, and with both payable the player chooses',
    'reading: "You may" is the player choosing to activate (a non-Event [Activate: Main] has no costOptional); not activating spends nothing',
    'reading: "up to 1" rested opponent Character, chosen on resolution; with none rested nothing happens (the cost is still paid)',
  ],
};
