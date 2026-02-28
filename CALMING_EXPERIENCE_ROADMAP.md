# Cybertemple — 20-Minute Calming Experience Roadmap

## North star
Create a quiet digital sanctuary people can return to daily: short, intentional, and soothing. Cybertemple should feel like stepping into a dimly lit observatory where the interface breathes with you, never rushes you, and always leaves you with a gentle sense of completion.

## Confirmed product decisions
- **Launch audience:** general wellness users.
- **Launch format:** solo-first experience.
- **Platform priority:** mobile-first (desktop parity follows).
- **Data posture in V1:** local-only storage by default.
- **Session cap behavior:** 20-minute cap is user-overridable with no interruption warning.
- **Audio strategy:** introduce generated sinewave calming pieces in **Version 3**.
- **Accessibility:** staged compliance toward WCAG AA.
- **Brand tone:** 20% mystical cyber / 80% minimalist calm.
- **Intention retention:** daily intentions persist until manually cleared.
- **Claims policy:** avoid therapeutic or clinical claims in product copy and UX.

## Voice + atmosphere guide (20/80 tone blend)
- **80% minimalist calm:** plain language, short phrases, no pressure verbs, no urgency.
- **20% mystical cyber:** sparse ritual words for texture (`attune`, `echo`, `glow`, `signal`).
- **What we avoid:** “heal,” “treat,” “therapy,” “diagnose,” “cure,” or any implication of medical outcomes.
- **Example microcopy style:**
  - “Welcome back. Let’s settle in.”
  - “Choose your pace.”
  - “When you’re ready, close gently.”

## Product goal
Build Cybertemple into a **calming, repeatable, interactive daily place** where people can spend up to 20 minutes, feel more settled, and return tomorrow for light continuity without pressure.

## Experience architecture (20-minute daily ritual)
### 0–2 min · Arrival (soft landing)
- Soft check-in: mood selection (`foggy`, `steady`, `wired`, `heavy`, `open`).
- Visual breathing anchor begins automatically (V1/V2 visual only).
- Interface enters calm mode: reduced motion, reduced contrast spikes, minimal text density.
- Opening line: “This space is quiet by default. You can change anything.”

### 2–8 min · Regulation (steadying loop)
- Guided **Breath + Rainfall sync** as the default path.
- Visual tempo adapts to breathing cadence and tap/hold input.
- Replace performance framing with neutral framing:
  - `throughput` → `pace`
  - `integrity` → `steadiness`
- Optional haptic-like visual feedback (soft glow, gentle pulse).

### 8–15 min · Reflection (light meaning)
- 1–2 simple reflection prompts.
- Private ritual log (no social prompts in early versions).
- One daily intention card:
  - “One small thing to carry into tomorrow.”
- Keep writing lightweight: short responses encouraged.

### 15–20 min · Closure (clean off-ramp)
- Summary card:
  - time spent
  - mood in/out
  - saved intention
- Closing message: “Session complete. Take one slow breath before you go.”
- At 20 minutes, present a quiet choice: **Close session** or **Continue**.

## Build roadmap
### Version 1 (Weeks 1–2) · Calm foundation (mobile-first)
- Ship mobile-first session shell for arrival/regulation/reflection/closure.
- Add default Calm mode and retire intense/chaotic status labels.
- Add reduced-motion and reduced-flash presets (respect OS settings).
- Implement local-only persistence for mood, session summaries, and intentions.
- Add claims-safe copy pass to remove all therapeutic wording.

### Version 2 (Weeks 3–6) · Core ritual quality
- Improve breathing guidance and rainfall synchronization smoothness.
- Tune reflection prompts for brevity and emotional safety.
- Keep solo-first path primary; no social surfaces.
- Add intention lifecycle controls (clear/edit/archive manually).
- Expand accessibility for core journey (keyboard nav + semantic labels).

### Version 3 (Weeks 7–10) · Optional audio layer
- Introduce generated sinewave calming pieces (low-complexity harmonic sets).
- Audio remains off by default; users opt in explicitly.
- Add simple controls: on/off, intensity, and volume.
- Add low-stim profile combining quieter visuals + softer audio envelope.

### Version 4 (Weeks 11–14) · Safety + accessibility hardening
- Add “Ground Me Now” instant ultra-minimal mode.
- Progress staged accessibility toward WCAG AA across main flows.
- Add privacy-forward product analytics (aggregate, non-intrusive).
- Validate copy and interaction safety with short usability studies.

### Version 5 (Weeks 15+) · Optional expansion
- Explore optional social echoes with strong moderation guardrails.
- Preserve solo path as first-class default forever.
- Publish trust notes and data transparency language in plain English.

## Success metrics
- **Primary**
  - Session completion at 10/15/20 minutes.
  - Self-reported “settled” delta (simple pre/post slider).
  - 7-day and 30-day return rate (no streak pressure).
- **Secondary**
  - Daily intention save rate and clear/edit behavior.
  - Breath-guidance completion rate.
  - Audio opt-in rate and average listening duration in V3+.
- **Safety/quality**
  - Overstimulation exits.
  - “Ground Me Now” activation rate.
  - Copy audit pass rate for claims-safe language.

## Engineering delivery slices
1. **Calm language system** (state labels, microcopy, claims-safe lint checklist).
2. **Breath engine + visual sync API** (mobile performance first).
3. **Session framework** (20-minute ritual + intentional continue flow).
4. **Local-first reflection model** (mood, prompts, intention, manual clear/archive).
5. **Sinewave audio module** (generator + control surface) for V3.
6. **Accessibility hardening track** (staged WCAG AA conformance).

## Open questions (new)
1. Should intentions support optional tags (e.g., `rest`, `focus`, `boundaries`) for future retrieval?
2. Do we want a dark-only aesthetic at launch, or dark/light themes from V1?
3. For local-only data, should export be JSON-only or include a readable TXT/MD journal format?


## Immediate implementation pack
- `V1_EXECUTION_CHECKLIST.md` — day-by-day build and QA plan for the first 2 weeks.
- `V1_COPY_DECK.md` — production-ready UI microcopy for V1 (claims-safe, mobile-friendly).
