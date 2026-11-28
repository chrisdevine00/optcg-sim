import type { CardScript } from '../../src/dsl.ts';

/** OP18-060 Saint Gunko (Leader). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_060: CardScript = {
  cardId: 'OP18-060',
  textHash: '1f347cf71ae087',
  verified: {
    source: 'cards/overrides/OP18-060.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'draw',
      label:
        'When a Character is played from your trash, draw 2 cards and trash 1 card from your hand',
      kind: 'auto',
      oncePerTurn: true,
      when: [
        {
          event: 'cardPlayed',
          by: 'you',
          from: 'trash',
          filter: {
            category: ['Character'],
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 2,
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
    {
      id: 'add-don',
      label:
        'You may trash 1 card from your hand: if you have a Character with 8000 base power or more, add up to 1 DON!! card as active',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'you',
              filter: {
                basePower: {
                  gte: 8000,
                },
              },
            },
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 1,
                    state: 'active',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'audit Q18 (proposed reading): any Character of yours played from your trash, by any effect (the rule play does not come from the trash, so it is always an effect), draws once per turn; a Character played from the deck, hand or Life does not count',
    'reading: "draw 2 cards and trash 1 card from your hand" is two plain steps, no "may"; the trash is chosen after the draw',
    'reading (B3A-R1): the "If" after the colon is an effect condition: the cost is paid and the Once Per Turn spent whether or not a Character with 8000 base power or more is there. "base power" is the printed power (given DON!! and buffs do not count)',
  ],
};
