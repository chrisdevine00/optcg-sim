/**
 * The coach's Math and Tempo sections and the opponent's-turn threat view (learning-ui §2.7, §2.9,
 * §3.1). Math adds only what the battle panel lacks; Tempo is the DON!! bar; the threat view
 * renders the worker's answer and says, always, that it does not count their hand.
 */
import type { G } from '../game/ui.ts';
import { ExplanationView } from './ExplanationView.tsx';
import { theyCouldHave } from './BattleExtras.tsx';
import { num } from '../game/text.ts';
import { ledgerOf, tempoExplanation, tempoLabel, type TempoLedger } from './tempo.ts';

// ---------------------------------------------------------------------------------------------
// Math
// ---------------------------------------------------------------------------------------------

const RULES = [
  'Ties go to the attacker (CR 7-1-4-1).',
  'DON!! add power only on their owner’s turn (CR 6-5-5-2).',
  'Boosts from Counters and effects last until the end of the battle (CR 7-1-5).',
];

export function MathSection({ g }: { g: G }) {
  const coach = g.ctl.coach;
  const b = g.view.battle;
  const mineAttack = !!b && g.cardOf(b.attacker)?.owner === g.me;
  const they = mineAttack ? theyCouldHave(g.view, g.opp, g.cards) : null;
  return (
    <div tabIndex={-1} className="coach-result" role="group" aria-label="DON!! math">
      {they ? (
        <>
          <p className="coach-lead">
            What they can make against this attack. The sum itself is in the battle panel.
          </p>
          <ul className="why-evidence" aria-label="What they can make">
            <li>
              {they.hand} {they.hand === 1 ? 'card' : 'cards'} in their hand
              {they.hand > 0
                ? `: at most +${num(they.total)} of Counters (+${num(they.perCard)} each).`
                : '.'}
            </li>
            <li>
              {they.blockers.length === 0
                ? 'No active Blockers.'
                : `${they.blockers.length} active ${they.blockers.length === 1 ? 'Blocker' : 'Blockers'}: each stops one attack.`}
            </li>
          </ul>
          <p className="coach-note">
            <span className="chip outline">
              {they.assumed ? '◌ Estimated' : '◉ From their deck’s sourced lists'}
            </span>{' '}
            {they.assumed
              ? 'No sourced list for their Leader: this uses a typical deck’s biggest Counter.'
              : 'The most one card could add, taken from the lists we know. It is a bound, not their hand.'}
          </p>
        </>
      ) : (
        <p className="coach-lead">
          Nothing to count yet. When you attack, this shows what they could make against it and how
          sure that is. The sum is in the battle panel.
        </p>
      )}
      <p className="ex-sub">Rules behind the numbers</p>
      <ul className="bx-list">
        {RULES.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <label className="coach-setting coach-check">
        <input
          type="checkbox"
          checked={coach.profile.donMath}
          onChange={(e) => coach.setProfile({ donMath: e.target.checked })}
        />
        <span>DON!! math on the board</span>
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Tempo
// ---------------------------------------------------------------------------------------------

const SEGMENTS = [
  { key: 'paid', label: 'Paid' },
  { key: 'given', label: 'Given' },
  { key: 'held', label: 'Held' },
  { key: 'unused', label: 'Unused' },
] as const;

function amount(l: TempoLedger, key: (typeof SEGMENTS)[number]['key']): number {
  return key === 'held' ? l.held.n : l[key];
}

/** The bar: patterned segments (never colour alone) and the label in words. */
export function TempoBar({ ledger, small = false }: { ledger: TempoLedger; small?: boolean }) {
  const total = Math.max(1, ledger.total);
  return (
    <div className={`tempo ${small ? 'small' : ''}`}>
      <div className="tempo-bar" role="img" aria-label={tempoLabel(ledger)}>
        {SEGMENTS.map((s) => {
          const n = amount(ledger, s.key);
          return n > 0 ? (
            <span
              key={s.key}
              className={`tp tp-${s.key}`}
              style={{ flexGrow: n, flexBasis: `${(n / total) * 100}%` }}
              data-testid={`tempo-${s.key}`}
            />
          ) : null;
        })}
      </div>
      <p className="tempo-label" data-testid="tempo-label">
        {tempoLabel(ledger)}
      </p>
    </div>
  );
}

export function TempoSection({ g }: { g: G }) {
  const coach = g.ctl.coach;
  const mineTurn = g.view.turn.activePlayer === g.me;
  const frozen = !mineTurn && coach.tempo !== null;
  const ledger = coach.tempo?.ledger ?? ledgerOf(g.view, g.cards);
  // The explanation reads the live view on your turn; on theirs the meter is your last turn's.
  const ex = mineTurn ? tempoExplanation(g.view, ledger, g.cards, 'ending') : null;
  return (
    <div tabIndex={-1} className="coach-result" role="group" aria-label="DON!! tempo">
      <TempoBar ledger={ledger} />
      <ul className="tempo-legend" aria-label="What the patterns mean">
        {SEGMENTS.map((s) => (
          <li key={s.key}>
            <span className={`tp tp-${s.key} key`} aria-hidden="true" />
            {s.label} {amount(ledger, s.key)}
          </li>
        ))}
      </ul>
      {frozen && (
        <p className="coach-note">Your last turn’s split. It resets at your next Refresh.</p>
      )}
      {mineTurn && ex && (
        <ExplanationView
          ex={ex}
          context="coach"
          verbosity={coach.profile.verbosity}
          idPrefix="coach-tempo"
        />
      )}
      {mineTurn && !ex && (
        <p>{ledger.total === 0 ? 'No DON!! on the field yet.' : 'Nothing is idle.'}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The opponent's-turn threat check
// ---------------------------------------------------------------------------------------------

export function ThreatView({ g }: { g: G }) {
  const coach = g.ctl.coach;
  const t = coach.threat;
  const opp = g.names.player[g.opp] || 'The opponent';
  return (
    <div className="coach-state">
      {t.status === 'idle' && (
        <>
          <p className="coach-lead">
            It is {opp}’s Main Phase. Does their board threaten lethal on you? This does not count
            the cards in their hand.
          </p>
          <button type="button" className="btn small primary" onClick={() => coach.press()}>
            Check their threat <kbd aria-hidden="true">L</kbd>
          </button>
        </>
      )}
      {t.status === 'checking' && (
        <div className="coach-checking" role="status">
          <span className="coach-bar" aria-hidden="true" />
          <span>Checking their board…</span>
        </div>
      )}
      {t.status === 'failed' && (
        <>
          <p>Couldn’t finish checking.</p>
          <button type="button" className="btn small" onClick={() => coach.retryThreat()}>
            Check again
          </button>
        </>
      )}
      {t.status === 'ready' && t.result && (
        <>
          <ExplanationView
            ex={t.result.explanation}
            context="coach"
            verbosity={coach.profile.verbosity}
            idPrefix="coach-threat"
          />
          <p className="coach-note" data-testid="threat-hand-note">
            This does not count the cards in their hand.
          </p>
          {t.result.status === 'unknown' && (
            <button type="button" className="btn small" onClick={() => coach.retryThreat()}>
              Check again
            </button>
          )}
        </>
      )}
    </div>
  );
}
