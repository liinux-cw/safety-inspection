# Safety Inspection (MaintainD)

## About the user
- Designer, not a developer. Explain things simply, avoid jargon, and do technical steps (git, setup, commands) for them.
- Communicates only through chat. Never ask them to edit files themselves.
- Prefers short, clear replies (Thai).

## Working rules
- Whenever the user shares anything about the feature (requirements, rules, flows, decisions, changes), update `docs/requirements.md` automatically — no special keyword needed. Briefly tell them what was recorded.
- If new info conflicts with what's recorded, ask which is correct before overwriting.
- Commit changes to git after meaningful updates.

## Collaboration
- GitHub: https://github.com/liinux-cw/safety-inspection (collaborator: พี่นุ)
- `main` = shared base. Each person works on their own branch.
- User's branch: `feature/create-inspection` (the "create inspection" feature). พี่นุ works on other parts on separate branches.
- NEVER push to GitHub on your own. Commit locally as work progresses; push ONLY when the user explicitly says it's ready / asks to upload. Pull latest `main` before starting new work.

## Feature overview
Safety Inspection feature for MaintainD. (Details: see `docs/requirements.md`)

## Tech stack / commands
TBD
