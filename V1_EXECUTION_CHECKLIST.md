# Cybertemple V1 Execution Checklist (2 Weeks, Mobile-First)

This checklist translates `CALMING_EXPERIENCE_ROADMAP.md` into a concrete V1 build plan.

## Scope lock (V1)
- Mobile-first solo experience.
- Local-only persistence.
- No therapeutic/clinical claims in UX copy.
- 20-minute ritual with intentional **Continue** option.
- Calm-first visual defaults and reduced stimulation.

## Definition of done (V1)
- A user can complete the full 20-minute ritual on mobile: arrival → regulation → reflection → closure.
- A user can continue past 20 minutes intentionally with a simple choice.
- Mood and daily intention are saved locally and reload correctly.
- Core screens are keyboard reachable and screen-reader labels exist on major controls.
- Copy audit passes claims-safe rules.

## Day-by-day plan

### Day 1 — Product + UX alignment
- Confirm V1 scope boundaries and non-goals.
- Freeze the V1 IA for the 4-step ritual.
- Finalize claims-safe content rules.
- Output: signed-off wireframe + acceptance criteria.

### Day 2 — Mobile shell + navigation
- Implement mobile layout scaffolding.
- Add top-level state machine for ritual steps.
- Ensure tap targets and spacing meet mobile usability norms.
- Output: navigable ritual skeleton.

### Day 3 — Arrival step
- Add mood check-in UI (`foggy`, `steady`, `wired`, `heavy`, `open`).
- Add calm intro line and start action.
- Persist mood-in timestamp locally.
- Output: working arrival flow.

### Day 4 — Regulation step
- Add visual breathing anchor and base cadence logic.
- Sync matrix/rainfall tempo to breath cycle.
- Add reduced-motion behavior when preference is enabled.
- Output: smooth regulation loop.

### Day 5 — Reflection step
- Add 1–2 short prompts with lightweight text entry.
- Add intention card (“One small thing to carry into tomorrow.”).
- Persist reflection + intention locally.
- Output: stable reflection capture.

### Day 6 — Closure + timer
- Add session timer and 20-minute threshold handling.
- Add close summary card (time, mood in/out, intention).
- Add quiet choice: **Close session** / **Continue**.
- Output: full ritual completion path.

### Day 7 — Calm language and state labels
- Replace high-intensity language with calm terms (`pace`, `steadiness`).
- Integrate approved microcopy deck.
- Run claims-safe content pass.
- Output: copy-complete UI for V1.

### Day 8 — Accessibility pass (core)
- Keyboard reachability for all critical actions.
- ARIA labels for mood controls, timer, and close actions.
- Verify contrast on mobile default theme.
- Output: accessibility baseline for core path.

### Day 9 — QA + persistence hardening
- Test local persistence restore and clear behavior.
- Validate session continuity across refreshes.
- Test reduced motion, narrow devices, and orientation change.
- Output: bug list resolved for V1 blockers.

### Day 10 — Release prep
- Final smoke test across target mobile browsers.
- Final copy audit for claims-safe wording.
- Prepare release notes + known limitations.
- Output: V1 release candidate.

## QA checklist (must pass)
- [ ] Arrival to closure works end-to-end on mobile width.
- [ ] Continue past 20 min works without disruptive warning.
- [ ] Data remains local-only; no remote calls introduced.
- [ ] Intentions persist until manually cleared.
- [ ] Reduced-motion mode removes non-essential animation.
- [ ] No therapeutic/clinical wording appears in UI text.

## Suggested owners (lightweight)
- Product/UX: scope, flow, copy approvals.
- Frontend: state machine, UI, persistence, timer.
- QA: mobile + accessibility regression.
- Content: claims-safe and tone consistency checks.
