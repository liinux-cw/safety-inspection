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
- Commit locally as work progresses. After a requested change is finished and all checks + browser tests pass, push the feature branch (user 2026-11-20). Never push failing work or to `main`. Pull latest `main` before starting new work.

## Feature overview
Safety Inspection feature for MaintainD. (Details: see `docs/requirements.md`)

## Terminology
- "ผู้ใช้" / "ผู้ใช้งาน" in requirements = system users (กบค., ผู้รับจ้าง), NOT the person chatting.

## Tech stack / commands
- Next.js 16 (App Router, `src/`) + Tailwind 4 + TypeScript, static export. Same stack as พี่นุ's maintenance prototype (GitHub `anugmail/maintenance-utility-vehicle` · local `../Maintanance` or `../maintenance-utility-vehicle`) — read-only reference, never edit it.
- `npm run dev` → http://localhost:3030
- Checks before saying done: `npm run typecheck` · `NEXT_PUBLIC_BASE_PATH=/safety-inspection npm run build` · `npm run check-wording` · no hex in `src/**/*.tsx` · click through in a real browser (desktop 1440 + mobile 402), no console errors.

## Design rules — real Figma components only (same as the maintenance prototype · user 2026-11-20)
Every piece on screen must trace back to a real component in Figma. Exceptions: the prototype bar and prototype-only pages.
1. **Sources (only these two Figma files):**
   - Library **(Component) VMS Plus** (`VmOC07pKEsDkHZagOgcSU2`) + real screens **(UI) VMS Plus – Release#2** (`fYD1yA1uzWsJSjHlcWKMNe`)
   - The repair team's **Maintain-D** file (ReceiptChecklist · HandoverSignature · InspectionChecklist · PartRequestStepPanel · …)
2. **Read specs before building:** every value (width, height, padding, gap, radius, color, border, font) comes from `figma-spec/<component name>.json` (copied from the maintenance prototype; `figma-spec/components.json` lists them — `components` = library, `maintainD` = Maintain-D file).
3. **Never use as a design reference:** HTML prototypes, generated artifacts or client screenshots (those show data and flow only), `components.css`. Don't copy classes, values or layout from them.
4. **One React file = one library component**, named exactly as in Figma, in `src/components/vms/`. Props use the Figma variant/property names (`Size="md"` `Color="Success"` `State`), never invented names.
5. **Component not in the library → stop and ask the user first.** Don't design it yourself. If it must be composed, build it only from library pieces, match how the real dev system does it (vmsplus-dev · vms-plus-uat.odds.team/maintain-d), and record it in `figma-spec/COMPOSED.md` (what it's made of · which dev page · why).
6. **Colors and tokens:** only from `src/styles/tokens.css` via the Tailwind theme (`src/styles/theme.css`, default palette cleared) · no hex in `.tsx` · no `style=` except values computed at runtime.
7. **Mobile (402 wide, per the Figma Mobile frames):** tables become `Mobile table` (second line `{ text, sub }` goes in Supporting text, never appended with " · ") · popups become bottom sheets · header buttons sit under the title · row "…" menus pass `mobileActions` so view/edit/delete icons show on the card (desktop keeps "…" + Dropdown menu).
8. **Wording:** Thai, exactly as on the Figma screens · no emoji · "ยานพาหนะ" not "รถ" (except API data) · spell "ไฮดรอลิก" — `npm run check-wording` enforces both.

## Code map
- `figma-spec/` — Figma component specs (`<name>.json`) · `components.json` list · `svg/` graphics · `COMPOSED.md` composed pieces.
- `src/components/vms|patterns|shell` — copied from ref prototype (shell/PrototypeBar adapted: role switch กบค./ผู้รับจ้าง, "จำลองอนุมัติแผน").
- `src/lib/mock/` — `data.ts` (vehicles, vendors, plans, upload rules) · `store.ts` (localStorage `si-next-v1`) · `plan.ts` (CRUD, no-overlap rule, docs).
- `src/app/` — `/` plan list · `/new/` `/edit/` `/detail/` (กบค.) · `/docs/` `/docs/plan/` (ผู้รับจ้าง) · `_lib/` PlanForm, VehiclePicker, DocsTable.
