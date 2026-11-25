import type { CardScript } from '../../src/dsl.ts';

/** ST22-001 Ace & Newgate. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST22_001: CardScript = {
  cardId: 'ST22-001',
  textHash: '048a75593369d0',
  verified: {
    source: 'cards/overrides/ST22-001.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'swap',
      label:
        'Once Per Turn, reveal 1 {Whitebeard Pirates} card from your hand: draw 1 and place the revealed card on top of your deck',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              typeIncludes: 'Whitebeard Pirates',
            },
            pick: {
              exactly: 1,
            },
            bind: 'shown',
          },
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
            move: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  ref: 'shown',
                },
              },
              to: {
                zone: 'deck',
                position: 'top',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the card revealed for the cost is the one placed on top; the draw comes first (the order of the text), so the card drawn is never the revealed one unless the deck was empty',
    'reading: the reveal cost is optional (the player chooses to activate); with no {Whitebeard Pirates} card in hand the ability cannot be paid',
  ],
};
