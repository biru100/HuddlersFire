# HuddlersFire · intent and work breakdown tree

**Purpose:** keep every action connected to a player-facing benefit, independent of the technology or AI currently used. See [canonical decisions](../project-intent.md) and [product direction](../product-direction.md). This map is an organization of known intent, not an authorization to add features.

## L0 — project purpose (user intent)

**HF-ROOT:** Create a welcoming online camp for indie-game developers to rest together, play, work in parallel and show each other games. The purpose is the experience of *being together*, not the volume of features or the number of automated artifacts.

## L1 — experiential branches (supported by prior user intent)

| Intent ID | Desired experience | How to recognize progress |
|---|---|---|
| HF-REST | Quiet co-presence, sitting by the fire and feeling others are around | Meaningful presence, comfort, characters and seating readable in ordinary use |
| HF-PLAY | Friendly playful interaction without overwhelming rest | Movement, reactions and playground actions are clear, fun, and appropriately separated |
| HF-WORK | Work alongside others, pause and rejoin naturally | Status, notes, timing, chat and return-to-camp continuity make sense |
| HF-SHOW | Discover and discuss indie games built by community members | Walkable exhibits, accessible game information, official media and useful links |

These are **experience intents**, not a mandatory feature backlog. The user has asked for all four scenes, not for equal weight or a fixed delivery order.

## L2 — sub-intents and cross-cutting quality

A project may serve several intents and quality constraints. Do not turn these derived engineering concerns into new independent user mandates.

- `HF-REST.PRESENCE`: visible characters, gentle animation, readable expression, seating and campfire atmosphere.
- `HF-PLAY.INTERACTION`: understandable movement/reactions, separate playground effects and fair shared behavior.
- `HF-WORK.AWARENESS`: co-working status, notes, people list, chat and audio continuity.
- `HF-SHOW.DISCOVERY`: exhibit content, portals, booth UI, official trailers and links.
- Cross-cutting `HF-Q-VISUAL`: coherent attractive quarter-view world and legible characters/UI.
- Cross-cutting `HF-Q-RELIABILITY`: host migration, RTC compatibility, state persistence/release safety and regression testing.
- Cross-cutting `HF-Q-ACCESS`: desktop/mobile input, zoom, readable content, fallback renderer, performance.
- Cross-cutting `HF-Q-OPERATIONS`: reproducible and observable development, release gates, asset provenance, safe GitHub/Work/Sites handoff.

Cross-cutting concerns link to L1 experience intents but **cannot alone establish feature priority**. The product direction or explicit user request does.

## L3 — initiatives (examples, not all approved priorities)

| Example initiative | Parent | Domain |
|---|---|---|
| `HF-I-PRESENCE-ART`: make camp characters feel alive without visual instability | HF-REST.PRESENCE + HF-Q-VISUAL | art / animation / rendering |
| `HF-I-PLAY-UX`: make playful interactions understandable and non-intrusive | HF-PLAY.INTERACTION + HF-Q-ACCESS | gameplay / UI |
| `HF-I-WORK-PRESENCE`: improve useful co-working awareness | HF-WORK.AWARENESS + HF-Q-ACCESS | UX / state |
| `HF-I-EXHIBITS`: improve discoverability of members' games | HF-SHOW.DISCOVERY + HF-Q-ACCESS | exhibitions / content |
| `HF-I-RTC-QUALITY`: verify join/host failover in real conditions | HF-REST / HF-PLAY / HF-WORK + HF-Q-RELIABILITY | network |
| `HF-I-SAFE-RELEASE`: protect rooms, login and data while releasing | all four experiences + HF-Q-OPERATIONS | platform / QA / release |

An initiative's status is **proposed** until its implementation scope is authorized. An example is not a new user-approved roadmap.

## L4 — work packages (one example)

`HF-TASK-NW-IDLE-V2`:
- Ancestors: `HF-ROOT → HF-REST → HF-REST.PRESENCE → HF-I-PRESENCE-ART → HF-TASK-NW-IDLE-V2`; secondary `HF-Q-VISUAL`.
- Outcome: one NW Idle that appears to breathe clearly and cutely at native display size, without unwanted visual drift.
- This is the **first controlled art-pipeline case**, not the whole harness or a global test gate.
- Current confirmed choices (2026-11-16): obvious cute breathing; ChatGPT concepts/key poses; Work/Codex may directly edit derivative art, with user's final art approval; initial 64×96 subject to in-game review; complete NW Idle first; minimal layered base on one character.
- Art approvals remain separate from technical, game and release approvals. See [current handoff](CURRENT.md) and task/approval contract in [work protocol](WORK_PROTOCOL.md).

## Classification rule

All new work begins with **why (L0/L1)** → expected effect/quality (L2) → initiative (L3) → single testable task (L4). Record parents, affected experience, meaningful observable acceptance evidence, side effects, user gates and status. Never prioritize by counting lines of code, CI tests, assets, PRs or frames alone.
