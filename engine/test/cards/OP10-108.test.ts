/** OP10-108 Scratchmen Apoo. */
import { describe, expect, it } from 'vitest';
import {
  APOO_Y,
  mk,
  oppAttack,
  OTHER_LEADER,
  SUPER5,
  SUPER_RED3,
  V,
  YELLOW_NON_SUPER,
} from './helpers-a10g3.ts';

const ID = 'OP10-108';
const keywords = (g: ReturnType<typeof mk>) => g.card(g.find('p1', 'characters', ID)).keywords;

describe('OP10-108 Scratchmen Apoo', () => {
  it('with another yellow Supernovas Character it gains [Blocker]', () => {
    expect(keywords(mk({ characters: [ID, SUPER5] }))).toContain('Blocker');
  });

  it('and can then block', () => {
    const g = oppAttack({ leader: OTHER_LEADER, characters: [ID, SUPER5] });
    const apoo = g.find('p1', 'characters', ID);
    expect(g.legal().some((a) => a.type === 'block' && a.blocker === apoo)).toBe(true);
  });

  it('must not have [Blocker] alone', () => {
    expect(keywords(mk({ characters: [ID] }))).not.toContain('Blocker');
  });

  it('must not count another [Scratchmen Apoo] (other than [Scratchmen Apoo])', () => {
    expect(keywords(mk({ characters: [ID, APOO_Y] }))).not.toContain('Blocker');
  });

  it('must not count a Supernovas Character that is not yellow', () => {
    expect(keywords(mk({ characters: [ID, SUPER_RED3] }))).not.toContain('Blocker');
  });

  it('must not count a yellow Character that is not Supernovas', () => {
    expect(keywords(mk({ characters: [ID, YELLOW_NON_SUPER, V.c1] }))).not.toContain('Blocker');
  });

  it('only your own Characters count', () => {
    const g = mk({ characters: [ID] }, { characters: [SUPER5] });
    expect(keywords(g)).not.toContain('Blocker');
  });
});
