# HuddlersFire · player-experience development loop

The purpose of development is **better camp experiences**, not more implementation. Use the user's four desired scenes and existing player feedback as the core evaluation perspective.

## Route feedback into useful work

**Observe** → **connect to experience intent** → **form one improvement hypothesis** → **smallest meaningful experiment** → **player-visible review** → **technical/regression verification** → **decision/handoff**.

For each feedback item or proposed improvement, record:
- Which experience is involved: quiet co-presence, playful interaction, working alongside others, or showing games? Cross-cutting reliability/visual/UX may support several.
- **What was actually observed**: user feedback, reproducible UI behavior, screenshot, recorded scenario, validated incident; separate conjecture from evidence.
- What should feel different for a real user after the change? A concrete acceptance question is preferable to arbitrary feature count.
- What else must stay intact: existing rooms/data, shared interactions, portals, audio, mobile input, visual consistency, performance, Discord and WebRTC.
- What is the smallest safe change and proof? Test scope proportional to impact; not every change needs full 16-player network QA.
- Who approves the result? Product scope, aesthetic quality, runtime adoption and live release are different gates.

## Experience questions, not preapproved metrics

| Experience | Example evaluative question |
|---|---|
| Rest / presence | Without typing or acting, is it comfortable and clear that others are present? |
| Play | Can players understand an interaction and share a fun reaction without disturbing the resting area? |
| Work | Can someone switch between working and being present without losing context? |
| Showcase | Can a visitor discover a member game and open its official information naturally? |
| Visual coherence | Can a player recognize a camper, stance and expression at ordinary in-game scale? |
| Reliability | Does a failure or update preserve the expected room, identity and session behavior? |
| Accessibility | Do desktop/mobile players understand controls, state, text and camera at realistic screen sizes? |

These are **review prompts**, not claims that a user has endorsed numeric targets. Numeric thresholds require measured baselines or user-approved objectives.

## Prioritization policy

Prioritize based on demonstrated harm/opportunity to player experience, user's latest explicit priorities, the number of experiences affected, risk to existing users/data, and feasibility of an observable safe test. Do not use recency of a chat, sheer number of changed pixels, asset counts, PR count or CI count as a proxy for value.

Be explicit whether an idea is **user-approved**, **observed**, **proposed**, **blocked**, **in progress**, or **superseded**. Record product review in `docs/product-review.md`, runtime truth in `docs/validation.md`, decisions in `docs/project-intent.md` and coordination state in `docs/harness/CURRENT.md`.

## Stop, learn, and re-scope

If a technique repeatedly misses the **experience criterion** despite passing technical checks, do not mass-produce or optimize that technique further. Restore the last known-good behavior, preserve failure evidence, and revisit the hypothesis. The NW Idle regenerated-frames vs. nearly-static interpolation case is one example, not a special rule for every project.
