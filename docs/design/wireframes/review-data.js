/*
 * Review data shared by the Overview (11b-review.html) and Study (11c-study.html) wireframes.
 * You (Rocks.D.Xebec) went second against Kaido (Pirate): your turns are even game turns. Flags from explanations.md.
 */
const opp = (id, x = {}) => K(id, { who: 'Opponent’s', ...x });
const SH = {
  diamond: '<svg viewBox="0 0 16 16"><path d="M8 1l7 7-7 7-7-7z" fill="currentColor"/></svg>',
  triF: '<svg viewBox="0 0 16 16"><path d="M8 1l7 13H1z" fill="currentColor"/></svg>',
  triH: '<svg viewBox="0 0 16 16"><path d="M8 2l6 11H2z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  sqH: '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  cirH: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  bar: '<svg viewBox="0 0 16 16"><rect x="2" y="6" width="12" height="4" fill="currentColor"/></svg>',
  eye: '<svg viewBox="0 0 16 16"><path d="M1 8s2.6-4.5 7-4.5S15 8 15 8s-2.6 4.5-7 4.5S1 8 1 8z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg>',
  dash: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 2.4"/></svg>',
};
// You went second: your turns are even game turns. Flags from explanations.md.
const FLAGS = {
  mull: { turn: 0, row: 'me', shape: 'bar', sev: 'min', name: 'Mulligan', e: null },
  e06: { turn: 8, row: 'me', shape: 'sqH', sev: 'mod', name: 'DON!! left unused', e: 'E06', what: 'Played Charlotte Linlin; your Leader attacked at 5000; Queen (+1000) stopped it. You ended with 3 active DON!!.' },
  e19: { turn: 9, row: 'me', shape: 'triH', sev: 'mod', name: 'Counter wasted', e: 'E19', what: 'Played Rocks Pirates: your Leader 7000. 7000 vs 7000: the hit landed (Life 3 → 2).' },
  e09: { turn: 10, row: 'me', shape: 'cirH', sev: 'mod', name: 'Poor attack ordering', e: 'E09', what: 'Shiki attacked Hawkins; Hawkins was K.O.’d.' },
  e02: { turn: 12, row: 'me', shape: 'eye', sev: 'min', name: 'Hindsight: lethal against their real hand', e: 'E02', what: 'Your Leader hit their Leader (Life 1 → 0). Then Shiki attacked King, Newgate attacked Queen, and Linlin stayed back.' },
  e05: { turn: 13, row: 'me', shape: 'triF', sev: 'sev', name: 'Hit that should have been countered', e: 'E05', what: 'Took Ulti’s hit (Life 0; the Life card was Kyo, no Counter). Stopped their Leader with Rocks Pirates and Buckin (8000). Played There’s No Authority on Kaido’s attack (7000 against 12000) and lost.' },
};
const BOARDS = {
  e05: () => ({ opp: { idText: 'Kaido · Pirate AI', hand: 0, donDeck: 0, active: 0, rested: 8, life: 2, deck: 19, leader: opp('OP17-058', { don: 2, p: 7000 }), trash: { n: 16, top: K('OP17-077') }, chars: [null, opp('OP17-060', { r: true, st: ['opp-act'], chips: [{ t: '⚔ attacking', cls: 'opp', pos: 'below' }], noRestChip: true }), opp('OP17-062'), null, null] },
    me: { donDeck: 0, active: 4, rested: 6, life: 1, deck: 16, leader: K('OP17-039', { who: 'Your' }), trash: { n: 18, top: K('OP17-049') }, chars: [null, null, null, null, null], hand: [K('OP17-056', { hand: true }), K('OP17-055', { hand: true }), K('OP08-051', { hand: true })] },
    mid: { turn: 'Turn 13 · Opponent’s turn', opp: true, battle: 'Counter' }, arrows: [{ from: 'opp.c2', to: 'me.leader', cut: 40 }] }),
  e02: () => ({ opp: { idText: 'Kaido · Pirate AI', hand: 4, donDeck: 0, active: 0, rested: 9, life: 0, deck: 20, leader: opp('OP17-058'), trash: { n: 14, top: K('OP17-076') }, chars: [null, opp('EB04-031', { r: true }), opp('EB04-032', { r: true }), null, null] },
    me: { donDeck: 0, active: 0, rested: 7, life: 2, deck: 18, leader: K('OP17-039', { who: 'Your', r: true, don: 3, p: 8000 }), trash: { n: 15, top: K('OP17-056') }, chars: [K('OP17-049'), K('OP17-048', { st: ['legal'], g: 'attack' }), K('OP17-040'), null, null], hand: [K('OP17-045', { hand: true }), K('OP17-054', { hand: true })] },
    mid: { turn: 'Turn 12 · Your turn', phase: 'Main' }, arrows: [{ from: 'me.c2', to: 'opp.leader', dashed: true, bend: -40 }] }),
  e06: () => ({ opp: { idText: 'Kaido · Pirate AI', hand: 5, donDeck: 3, active: 2, rested: 5, life: 3, deck: 28, leader: opp('OP17-058'), trash: { n: 4, top: K('EB04-032') }, chars: [null, opp('OP17-074'), null, null, null] },
    me: { donDeck: 2, active: 3, rested: 5, life: 4, deck: 30, leader: K('OP17-039', { who: 'Your', r: true }), trash: { n: 3, top: K('OP17-050') }, chars: [null, null, K('OP17-049', { chips: [{ t: 'New', pos: 'top' }] }), null, null], hand: [K('OP17-056', { hand: true }), K('OP17-055', { hand: true }), K('OP17-045', { hand: true }), K('OP17-048', { hand: true })] },
    mid: { turn: 'Turn 8 · Your turn', phase: 'End' } }),
  e19: () => ({ opp: { idText: 'Kaido · Pirate AI', hand: 4, donDeck: 1, active: 3, rested: 4, life: 3, deck: 27, leader: opp('OP17-058', { r: true, don: 2, p: 7000, st: ['opp-act'], chips: [{ t: '⚔ attacking', cls: 'opp', pos: 'below' }], noRestChip: true }), trash: { n: 5, top: K('EB04-032') }, chars: [null, opp('OP17-074'), opp('EB04-031'), null, null] },
    me: { donDeck: 0, active: 3, rested: 5, life: 3, deck: 28, leader: K('OP17-039', { who: 'Your', p: 7000 }), trash: { n: 5, top: K('OP17-055') }, chars: [null, null, K('OP17-049'), null, null], hand: [K('OP17-056', { hand: true, st: ['hand-raise'], chips: [{ t: '+2000 ✓', cls: 'you', pos: 'top' }] }), K('OP08-051', { hand: true }), K('OP17-045', { hand: true }), K('OP17-048', { hand: true })] },
    mid: { turn: 'Turn 9 · Opponent’s turn', opp: true, battle: 'Counter' }, arrows: [{ from: 'opp.leader', to: 'me.leader', cut: 40 }] }),
  e09: () => ({ opp: { idText: 'Kaido · Pirate AI', hand: 2, donDeck: 0, active: 3, rested: 6, life: 2, deck: 24, leader: opp('OP17-058'), trash: { n: 9, top: K('OP15-078') }, chars: [null, opp('OP17-073', { r: true }), null, null, null] },
    me: { donDeck: 0, active: 1, rested: 9, life: 2, deck: 22, leader: K('OP17-039', { who: 'Your', r: true }), trash: { n: 11, top: K('OP17-055') }, chars: [null, K('OP17-049', { r: true, p: 5000 }), K('OP17-048', { st: ['legal'], g: 'attack' }), null, null], hand: [K('OP17-045', { hand: true }), K('OP17-046', { hand: true })] },
    mid: { turn: 'Turn 10 · Your turn', phase: 'Main' }, arrows: [{ from: 'me.c3', to: 'opp.leader', dashed: true, bend: -60 }] }),
};
// Turn 6 (your 3rd turn, going second): the turn's starting position, which "not fully checked" restores (UX-R31)
BOARDS.unchecked = () => ({ opp: { idText: 'Kaido · Pirate AI', hand: 6, donDeck: 4, active: 0, rested: 6, life: 4, deck: 30, leader: opp('OP17-058'), trash: { n: 2, top: K('OP15-078') }, chars: [null, opp('OP17-074'), null, null, null] },
    me: { donDeck: 4, active: 6, rested: 0, life: 5, deck: 32, leader: K('OP17-039', { who: 'Your' }), trash: { n: 1, top: K('OP17-050') }, chars: [null, null, K('OP17-044'), null, null], hand: [K('OP17-056', { hand: true }), K('OP17-055', { hand: true }), K('OP17-045', { hand: true }), K('OP17-048', { hand: true }), K('OP17-049', { hand: true }), K('OP08-051', { hand: true })] },
    mid: { turn: 'Turn 6 · Your turn', phase: 'Main' } });
BOARDS.analysing = BOARDS.e06;
// Mulligan (turn 0): the opening hand before Life is placed
BOARDS.mull = () => ({ opp: { idText: 'Kaido · Pirate AI', hand: 5, donDeck: 10, active: 0, rested: 0, life: null, deck: 45, leader: opp('OP17-058'), trash: { n: 0 }, chars: [null, null, null, null, null] },
    me: { donDeck: 10, active: 0, rested: 0, life: null, deck: 45, leader: K('OP17-039', { who: 'Your' }), trash: { n: 0 }, chars: [null, null, null, null, null], hand: [K('OP17-049', { hand: true }), K('OP17-048', { hand: true }), K('OP17-040', { hand: true }), K('OP17-118', { hand: true }), K('OP17-056', { hand: true })] },
    mid: { turn: 'Mulligan · Turn 0', phase: 'Refresh' } });
const SEV = { sev: 'Severe', mod: 'Moderate', min: 'Minor' };
const ORDER = ['mull', 'e06', 'e19', 'e09', 'e02', 'e05'];
