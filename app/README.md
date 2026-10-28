# app

React UI: board, tutorial, coach panel, review, meta explorer, deck builder, drills, settings.

Contains no rules logic. Whenever it needs to know whether something is legal, it asks the engine's public API. Never imports engine or ai internals (enforced by ESLint).
