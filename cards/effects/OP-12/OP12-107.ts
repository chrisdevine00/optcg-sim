import type { CardScript } from '../../src/dsl.ts';

/** OP12-107 Donquixote Doflamingo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_107: CardScript = {
  cardId: 'OP12-107',
  textHash: '0edd651b012478',
  verified: {
    source: 'cards/overrides/OP12-107.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush',
      label: 'With 2 or less Life, this Character gains [Rush]',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              life: 'you',
            },
            '<=',
            2,
          ],
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Rush',
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label:
        "[Opponent's Turn] [On K.O.] Add up to 1 card from the top of your deck to the top of your Life",
      kind: 'auto',
      when: ['onKO'],
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'deckTop',
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'life',
                position: 'top',
              },
            },
          },
        },
      ],
    },
  ],
};
