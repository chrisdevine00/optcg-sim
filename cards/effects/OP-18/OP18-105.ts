import type { CardScript } from '../../src/dsl.ts';

/** OP18-105 Spandam. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_105: CardScript = {
  cardId: 'OP18-105',
  textHash: '1812acae56aa8c',
  verified: {
    source: 'cards/overrides/OP18-105.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'trigger',
      label:
        'If your Leader\'s type includes "CP", reveal up to 1 "CP" card other than [Spandam] from your hand and activate its [Trigger]',
      kind: 'trigger',
      effect: [
        {
          if: { leader: { typeIncludes: 'CP' } },
          then: [
            {
              do: {
                select: {
                  from: 'hand',
                  owner: 'you',
                  filter: { all: [{ typeIncludes: 'CP' }, { not: { name: 'Spandam' } }] },
                  pick: { upTo: 1 },
                  reveal: true,
                  bind: 'r',
                },
              },
            },
            {
              do: {
                activate: {
                  ability: 'trigger',
                  of: { from: 'hand', owner: 'you', filter: { ref: 'r' } },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    "OP-18 wave G6: the revealed card's [Trigger] runs with it as its source and the card stays in the hand unless the effect moves it (M6b-Q98); a card with no [Trigger] does nothing",
  ],
};
