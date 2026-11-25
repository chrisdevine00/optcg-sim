import type { CardScript } from '../../src/dsl.ts';

/** OP13-119 Portgas.D.Ace. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_119: CardScript = {
  cardId: 'OP13-119',
  textHash: '0c6752bc2f52b8',
  verified: {
    source: 'cards/overrides/OP13-119.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush',
      label: 'If you have 3 or less Life cards, this Character gains [Rush]',
      kind: 'permanent',
      conditions: [{ cmp: [{ life: 'you' }, '<=', 3] }],
      apply: [{ grant: { target: { from: 'self', owner: 'you' }, keyword: 'Rush' } }],
    },
    {
      id: 'on-play',
      label:
        "Give up to 1 rested DON!! card to your Leader. Then, you may return up to 1 of your opponent's Characters with a cost of 5 or less to the owner's hand; if you do, your opponent plays up to 1 Character card with a cost of 4 or less from their hand",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: { from: 'leader', owner: 'you', pick: { upTo: 1 } },
            },
          },
        },
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: { cost: { lte: 5 } },
                pick: { upTo: 1 },
              },
              to: { zone: 'hand' },
            },
          },
          label: 'bounce',
        },
        {
          ifDid: 'bounce',
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'opponent',
                    chooser: 'opponent',
                    filter: { all: [{ category: ['Character'] }, { cost: { lte: 4 } }] },
                    pick: { upTo: 1 },
                  },
                  player: 'opponent',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (as OP13-005): "give up to 1 rested DON!! card to your Leader" is the Leader pick with `upTo: 1`: the player is asked (min 0, max 1), so "up to" is honoured and the single legal target is not auto-chosen',
    'reading (M4b-5): the "Then, you may return" is a plain sequence after the DON!! give (it happens whether or not a DON!! was given); "If you do" is a Character actually returned, so choosing none plays nothing',
    'reading (G51, M6b-Q75): the opponent chooses and plays free from their own hand, a full Character area makes them trash one of their own first, and the Character just returned to their hand is one of the candidates (cost 5 or less returned, cost 4 or less played)',
    'reading: "3 or less Life cards" is a live permanent condition (Rush on at 3, off at 4); it is the controller\'s Life',
  ],
};
