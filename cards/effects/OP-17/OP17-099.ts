import type { CardScript } from '../../src/dsl.ts';

/** OP17-099 Charlotte Linlin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_099: CardScript = {
  cardId: 'OP17-099',
  textHash: '1c1c4900b5da3f',
  verified: {
    source: 'cards/overrides/OP17-099.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        'Trash 1 card from your hand: your opponent chooses one: you trash 1 and add the top deck card to Life, or you trash 1 card from their hand',
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          chooseOne: [
            [
              { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } },
              {
                do: {
                  move: {
                    what: { from: 'deckTop', owner: 'you', pick: { upTo: 1 } },
                    to: { zone: 'life', position: 'top' },
                  },
                },
              },
            ],
            [
              {
                do: {
                  trashFromHand: {
                    from: 'hand',
                    owner: 'opponent',
                    blind: true,
                    pick: { exactly: 1 },
                  },
                },
              },
            ],
          ],
          chooser: 'opponent',
          labels: [
            "Charlotte Linlin's player trashes 1 card from their hand, then adds the top card of their deck to their Life",
            "Charlotte Linlin's player trashes 1 card from your hand",
          ],
          neutral: [
            "Charlotte Linlin's player trashes 1 card from their hand, then adds the top card of their deck to their Life.",
            "Charlotte Linlin's player trashes 1 card from the opponent's hand.",
          ],
        },
      ],
    },
  ],
  rulings: [
    'audit Q12: "your" in mode 1 is the Leader\'s controller (the opponent only chooses the mode); mode 2 trashes from the opponent\'s hand with the controller choosing face-down (QA-OP17 OP17-099, blind)',
    'reading: in mode 1, "Then, add up to 1 card from the top of your deck" happens even if the hand was empty (Then is not If you do)',
  ],
};
