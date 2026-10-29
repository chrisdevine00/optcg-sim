/** GameController reveal resets on their own (review M3-40): game over and rewind. */
import { describe, expect, it } from 'vitest';
import type { Action } from '@optcg/engine';
import { GameController } from '../src/play/game/controller.ts';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { cardMap } from './support.ts';

const settle = () => new Promise((r) => setTimeout(r, 400));

async function defending() {
  const { mode: _m, ...spec } = SCENARIOS.defend!;
  const ctl = new GameController(
    cardMap(),
    { scenario: spec },
    {
      mode: 'hotseat',
      human: 'p1',
      names: { p1: 'Player 1', p2: 'Player 2' },
      tier: 'rookie',
      autoSkip: true,
      alwaysSkip: false,
      speed: 4,
    },
  );
  ctl.start();
  await settle();
  ctl.liftCurtain();
  const v = ctl.view();
  const attack = ctl
    .actions()
    .find(
      (a) =>
        a.type === 'attack' &&
        a.attacker === v.zones.p2.leader[0]!.handle &&
        a.target === v.zones.p1.leader[0]!.handle,
    ) as Action;
  expect(ctl.act(attack)).toBe(true);
  await settle();
  expect(ctl.me).toBe('p1');
  expect(ctl.handVeil).toBe('hold');
  ctl.setReveal(true, true);
  expect(ctl.revealed()).toBe(true);
  return ctl;
}

describe('the reveal never outlives its moment (review M3-36, M3-40)', () => {
  it('ends when the game ends, by the game-over path alone', async () => {
    const ctl = await defending();
    // End the game straight through the session, so restart() (which concede() calls) is not
    // involved: only finish() can clear the reveal.
    ctl.session.apply('p1', { type: 'concede', player: 'p1' });
    ctl.start();
    await settle();
    expect(ctl.session.view('p1').result).not.toBeNull();
    expect(ctl.revealHeld).toBe(false);
    expect(ctl.revealSticky).toBe(false);
    expect(ctl.revealed()).toBe(false);
    ctl.dispose();
  });

  it('ends on a rewind, by the restart path alone', async () => {
    const ctl = await defending();
    ctl.rewindTo(0);
    expect(ctl.revealHeld).toBe(false);
    expect(ctl.revealSticky).toBe(false);
    ctl.dispose();
  });
});
