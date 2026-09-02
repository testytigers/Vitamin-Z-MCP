# Tasks

Self-contained units of work from `../TEST-PLAN.md`. Each file is small enough for one
session and states its own acceptance criteria, so you can say "do T0.1" and nothing else.

Every task ends with a **Prove it fails** step. That is not ceremony: four of the bugs
found in the 2026-09-02 review were in the checks themselves, so a check that has only
ever been seen passing is not yet a check.

| Task | Tier | Cost | What it closes |
|---|---|---|---|
| `T0.1-audit-in-ci.md` | 0 · gate | ~15 min | The audits are not enforced on any pull request |
| `T0.2-typecheck-components.md` | 0 · gate | ~half a day | Nothing compiles the 45 components |
| `T1.1-render-tests.md` | 1 | ~1 day | No component has ever been rendered by a machine |
| `T1.2-a11y-tests.md` | 1 | ~1 day | Rendered accessibility is entirely unchecked |
| `T1.3-visual-regression.md` | 1 | ~half a day | Token changes are invisible until a human looks |
| `T2.1-server-unit-tests.md` | 2 | ~1 day | 1,723 lines with end-to-end coverage only |
| `T3-audit-additions.md` | 3 | ~2 hours | Six specific holes in the existing suites |
| `T4-decisions.md` | 4 | discussion | Six open judgement calls, not bugs |
| `T5-live-model.md` | 5 | ~20 min | The original goal is untested end to end |

Order: **T0.1, then `../HUMAN-TEST.md` §1, then T0.2.** Everything else is additive.

## Status convention

Each task carries a `Status:` line — `not started`, `in progress`, `blocked: <why>`, or
`done <date>`. Update it in the same commit as the work, so the file and the repo agree.
