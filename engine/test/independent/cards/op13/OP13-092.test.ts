/**
 * OP13-092 Saint Mjosgard (Character, Black, cost 2, 0 power, Counter +2000, {Celestial Dragons}).
 *
 * Card text: "[On Play] If you have 3 or less Life cards, play up to 1 "Mary Geoise" type Stage card
 * with a cost of 1 from your trash."
 *
 * Rules: CR 8-3-3 (a failed "if" ends the text), CR 8-4-4-1 ("up to"), CR 3-8-5-1 (a new Stage
 * replaces the old one). Scenery: OP05-097 Mary Geoise (Black Stage, cost 1, {Mary Geoise}) and
 * OP13-099 The Empty Throne (Black Stage, cost 7, {Mary Geoise}), OP05-117 Upper Yard (Yellow
 * Stage, cost 1, {Sky Island}).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  atMain,
  BLUE,
  chars,
  don,
  doneRaw,
  kind,
  LD13,
  mine,
  need,
  offeredIds,
  pickRaw,
  playRaw,
  S13,
  SC15,
  trash,
  canFinish,
} from './kit-op13d.ts';

const ID = 'OP13-092';
const MG = S13.maryGeoise;
const THRONE = 'OP13-099';

function start(
  o: {
    life?: number;
    trash?: string[];
    stage?: string;
    p2trash?: string[];
  } = {},
): TestGame {
  const g = mine(
    LD13.black,
    {
      hand: [ID],
      life: Array.from({ length: o.life ?? 3 }, () => BLUE),
      trash: o.trash ?? [MG, SC15.red2],
      ...(o.stage ? { stage: o.stage } : {}),
    },
    { trash: o.p2trash ?? [] },
  );
  playRaw(g, g.find('p1', 'hand', ID));
  return g;
}

const stageIds = (g: TestGame) => g.zone('p1', 'stage').map((c) => c.card);

describe('OP13-092 Saint Mjosgard: [On Play] with 3 or less Life, play a cost 1 {Mary Geoise} Stage from the trash', () => {
  it('3 Life: offers the Stage from the trash; picking it plays it for free', () => {
    const g = start();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([MG]);
    pickRaw(g, at(g, 'p1', 'trash', MG));
    expect(stageIds(g)).toEqual([MG]);
    expect(trash(g)).toEqual([SC15.red2]);
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
  });

  it('boundary: 4 Life is too many, the Stage stays in the trash and nothing is asked', () => {
    const g = start({ life: 4 });
    expect(kind(g)).not.toBe('choose');
    expect(atMain(g)).toBe(true);
    expect(stageIds(g)).toEqual([]);
    expect(trash(g)).toEqual([MG, SC15.red2].sort());
  });

  it('0 Life counts as "3 or less"', () => {
    const g = start({ life: 0 });
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p1', 'trash', MG));
    expect(stageIds(g)).toEqual([MG]);
  });

  it('"up to 1": choosing nothing is legal and leaves the Stage in the trash', () => {
    const g = start();
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    doneRaw(g);
    expect(stageIds(g)).toEqual([]);
    expect(trash(g)).toEqual([MG, SC15.red2].sort());
  });

  it('cost boundary: the cost 7 {Mary Geoise} Stage (The Empty Throne) in the trash is not offered', () => {
    const g = start({ trash: [THRONE, MG] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([MG]);
    pickRaw(g, at(g, 'p1', 'trash', MG));
    expect(trash(g)).toEqual([THRONE]);
  });

  it('only a {Mary Geoise} Stage qualifies: another cost 1 Stage and a plain card are not offered', () => {
    const g = start({ trash: [S13.upperYard, SC15.red2, MG] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([MG]);
  });

  it('only my own trash is searched: the Stage in the opponent’s trash is not offered', () => {
    const g = start({ trash: [SC15.red2], p2trash: [MG] });
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      doneRaw(g);
    }
    expect(stageIds(g)).toEqual([]);
    expect(trash(g, 'p2')).toEqual([MG]);
  });

  it('a Stage already in play is trashed and replaced (CR 3-8-5-1)', () => {
    const g = start({ stage: S13.upperYard });
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p1', 'trash', MG));
    expect(stageIds(g)).toEqual([MG]);
    expect(trash(g)).toEqual([S13.upperYard, SC15.red2].sort());
  });

  it('with nothing to play the effect does nothing and the Character stays', () => {
    const g = start({ trash: [SC15.red2] });
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      doneRaw(g);
    }
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([SC15.red2]);
  });
});
