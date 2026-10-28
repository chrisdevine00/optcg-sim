# ai

Opponent tiers (Rookie, Pirate, Warlord, Emperor), archetype playbooks, and analysis for Game Review. Runs in a Web Worker. Exposes `chooseAction(view, budgetMs)` and `analyze(replay)`.

Depends on the public APIs of `engine` and `cards`. Only ever receives player views, never raw state, and only picks from `legalActions(view)`.
