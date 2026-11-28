import type { CardScript } from '../../src/dsl.ts';

/** OP18-004 Karoo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_004: CardScript = {
  cardId: 'OP18-004',
  textHash: '1a103794992775',
  verified: {
    source: 'cards/overrides/OP18-004.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'power-5000',
      label: 'With 5000 power or more, gains [Rush]',
      kind: 'permanent',
      conditions: [
        {
          self: {
            power: {
              gte: 5000,
            },
          },
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
      id: 'power-6000',
      label: 'With 6000 power or more, gains [Banish]',
      kind: 'permanent',
      conditions: [
        {
          self: {
            power: {
              gte: 6000,
            },
          },
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Banish',
          },
        },
      ],
    },
    {
      id: 'power-7000',
      label: 'With 7000 power or more, gains [Unblockable]',
      kind: 'permanent',
      conditions: [
        {
          self: {
            power: {
              gte: 7000,
            },
          },
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Unblockable',
          },
        },
      ],
    },
  ],
  rulings: [
    'Q14 proposed reading (m6b-audit OP-18): the three effects are cumulative, each read on its own; power is the current power incl. given DON!! and other effects (the grant stage reads the power stage); the keywords are gained, not printed',
  ],
};
