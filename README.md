# Cybertemple Observatory

This repo now includes a standalone web interface under `cybertemple/` so you can work with a real UI (not only workflow YAML):

- `cybertemple/index.html`
- `cybertemple/styles.css`
- `cybertemple/app.js`

## Run locally

```bash
python -m http.server 8000 --bind 0.0.0.0
```

Open `http://127.0.0.1:8000/cybertemple/`.

## Workflow behavior

The `003.yml` workflow remains manual-only and now packages this UI by copying `cybertemple/*` into `public/`.

## Enterprise Roadmap

### Phase 1 — Productize the current single-page temple (0–2 months)
- Split runtime concerns into modules: state, telemetry, rendering, and interaction layers.
- Add deterministic test harnesses for procedural generators and state transitions.
- Formalize schema versioning for local persistence and future backend sync.
- Introduce feature flags for experimental subsystems (ticker packs, graph channels, sigil mechanics).

### Phase 2 — Multi-tenant backend foundation (2–4 months)
- Build a service API for event streams, anonymous offerings, and profile fingerprints.
- Move continuity data from local-only storage to cloud persistence with conflict-safe sync.
- Add queue-driven event orchestration (scheduled arcs, season switches, world incidents).
- Implement moderation and abuse controls for community echoes and uploads.

### Phase 3 — Observability, reliability, and security hardening (4–8 months)
- Add OpenTelemetry tracing and metrics across frontend, API, and event workers.
- Define SLOs for event latency, feed freshness, and artifact availability.
- Ship role-based access, secret management, and audit logging for operators.
- Perform threat modeling, dependency scanning, and regular pen test cycles.

### Phase 4 — Enterprise platform capabilities (8–12 months)
- Offer organization workspaces with private chambers and shared ritual pipelines.
- Add SSO/SAML, SCIM provisioning, and policy controls for enterprise customers.
- Provide white-label theme kits and managed seasonal content scheduling.
- Expose integration APIs/webhooks so external systems can trigger temple events.

### Phase 5 — Scale and ecosystem (12+ months)
- Launch plugin/extension SDK for third-party “subsystems” and artifact builders.
- Operate regional deployments for data residency and low-latency experiences.
- Publish governance and trust framework for content provenance and model safety.
- Build a partner program for agencies and studios authoring premium arcs.

## Calming Product Roadmap

See `CALMING_EXPERIENCE_ROADMAP.md` for a focused plan to evolve Cybertemple into a 20-minute calming daily ritual product.


### V1 Implementation Docs

- `V1_EXECUTION_CHECKLIST.md`
- `V1_COPY_DECK.md`

