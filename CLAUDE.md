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
- GitHub: https://github.com/liinux-cw/safety-inspection (collaborator: พี่นุ = GitHub `anugmail`)
- `main` = shared base. Each person works on their own branch.
- User's branch: `feature/create-inspection` (the "create inspection" feature). พี่นุ works on other parts on separate branches.
- NEVER push to GitHub on your own. Commit locally as work progresses; push ONLY when the user explicitly says it's ready / asks to upload. Pull latest `main` before starting new work.

## Feature overview
Safety Inspection feature for MaintainD. (Details: see `docs/requirements.md`)

## Terminology
- "ผู้ใช้" / "ผู้ใช้งาน" in requirements = system users (กบค., ผู้รับจ้าง), NOT the person chatting.

## Tech stack / commands
- Next.js 16 (App Router, `src/`) + Tailwind 4 + TypeScript, static export. Same stack and rules as พี่นุ's prototype `../Maintanance` (read-only reference — never edit it; its `CLAUDE.md` rules apply here: components from Figma library only, colors from tokens, no hex in .tsx, say "ยานพาหนะ" not "รถ", Thai UI text, mobile = 402).
- `npm run dev` → http://localhost:3030
- Checks before saying done: `npm run typecheck` · `NEXT_PUBLIC_BASE_PATH=/safety-inspection npm run build` · `npm run check-wording` · no hex in `src/**/*.tsx` · click through in a real browser (desktop 1440 + mobile 402), no console errors.

## Code map
- `src/components/vms|patterns|shell` — copied from ref prototype (shell/PrototypeBar adapted: role switch กบค./ผู้รับจ้าง, "จำลองอนุมัติแผน").
- `src/lib/mock/` — `data.ts` (vehicles, vendors, plans, upload rules) · `store.ts` (localStorage `si-next-v1`) · `plan.ts` (CRUD, no-overlap rule, docs).
- `src/app/` — `/` plan list · `/new/` `/edit/` `/detail/` (กบค.) · `/docs/` `/docs/plan/` (ผู้รับจ้าง) · `_lib/` PlanForm, VehiclePicker, DocsTable.
