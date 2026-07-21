# Plan 002: Restyle and harden the tmux help dialog

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> STOP condition occurs, stop and report; do not improvise. Commit the work in
> the assigned Ollin worktree. Skip every instruction to update
> `plans/README.md`; the parent reviewer owns Improve artifacts.
>
> **Required coding standard**: Before modifying source or tests, read
> `/Users/gocanto/Sites/skills/.agents/skills/typescript-coding-standards/SKILL.md`
> completely. Preserve this repository's class-based, concern-separated,
> dependency-free renderer design. The user constraints below override any
> generic recommendation to add interfaces, adapters, reflection, `typeof`,
> `instanceof`, or `Record` types.
>
> **Drift check (run first)**:
> `git diff --stat 41f59cd..HEAD -- plugins/tmux-keybindings/herdr-plugin.toml plugins/tmux-keybindings/src/presentation/bindings-panel-renderer.ts plugins/tmux-keybindings/src/presentation/panel-close-shortcut.ts plugins/tmux-keybindings/src/presentation/terminal/dialog-palette.ts plugins/tmux-keybindings/src/presentation/terminal/styled-segment.ts plugins/tmux-keybindings/src/presentation/terminal/terminal-line.ts plugins/tmux-keybindings/tests/architecture/plugin-contract.test.ts plugins/tmux-keybindings/tests/presentation/bindings-panel-renderer.test.ts plugins/tmux-keybindings/tests/presentation/panel-close-shortcut.test.ts plugins/tmux-keybindings/tests/support/terminal-output.ts`
> Stop on a material mismatch with the current-state excerpts or contracts.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none; Ollin stacks it after Plan 001 operationally
- **Category**: bug
- **Planned at**: commit `41f59cd`, 2026-07-21
- **Ollin delivery**: PR READY
- **Worktree**: `/Users/gocanto/.codex/worktrees/codex/herdr-plugin-plan-002-tmux-help-dialog`
- **Branch**: `chore/ollin-tmux-help-dialog`
- **Routing profile**: `gpt-5.6-sol@high=100%`
- **Effective routing**: `gpt-5.6-sol@high=100%`
- **Model**: `gpt-5.6-sol`
- **Level**: `high`
- **Harness**: authenticated Codex CLI (`codex`)
- **Approved commit**: `65b98fca0610ed99460d291663ed7106275699e6`
- **Draft PR**: `https://github.com/oullin/herdr-plugins/pull/7`
- **PR head**: `65b98fca0610ed99460d291663ed7106275699e6`
- **PR state**: ready for review; current-head CI passed; no review threads,
  top-level comments, or requested changes
- **Automated review note**: the discontinued Gemini consumer integration did
  not run after the ready transition; parent review plus two independent
  `gpt-5.6-sol` high-reasoning reviews approved the current head
- **Parent review**: APPROVE; focused tests 8/8, full suite 92/92,
  formatting, linting, typechecking, audit, render geometry, strict input,
  diff hygiene, exact scope, and architecture policy checks passed; two
  independent read-only reviews approved architecture and behavior

## Why this matters

The tmux help popup is functional but visually disconnected from the supplied
Herdr help-dialog reference. Its two-column, unstyled output also becomes hard
to scan at the target size. Separately, its close detector accepts any byte
sequence containing Escape, so ordinary terminal arrow keys and unrelated Alt
keys close the dialog. Deliver the requested visual hierarchy while making the
documented close behavior precise.

## Current state

- `plugins/tmux-keybindings/src/presentation/bindings-panel-renderer.ts:8-23`
  builds a centred plain-text header and chooses a two-column layout at widths
  of 72 or more. It has no ANSI palette or fixed footer.
- `plugins/tmux-keybindings/src/presentation/panel-close-shortcut.ts:5-12`
  scans every byte and returns `true` when any byte equals Escape or Ctrl+C.
  Arrow keys begin with Escape, so they are incorrectly accepted.
- `plugins/tmux-keybindings/herdr-plugin.toml:45-50` declares an `84` by `24`
  popup. The single-column target needs 30 rows to show all existing groups.
- `PANEL_GROUPS` in
  `plugins/tmux-keybindings/src/domain/keybinding-profile.ts` remains the
  authoritative command catalogue. Do not edit or duplicate it.
- Existing renderer and shortcut tests under `tests/presentation/` are direct,
  behavior-focused Vite+ tests. Extend them without snapshots or module mocks.

## Visual contract

Use this exact palette:

| Role | Colour |
| --- | --- |
| Background | `#1a1b26` |
| Primary text | `#c0caf5` |
| Muted text | `#737aa2` |
| Section heading | `#7dcfff` |
| Shortcut | `#bb9af7` |
| Close badge background | `#7aa2f7` |
| Close badge text | `#1a1b26` |

At `84x30`, render this hierarchy without overflow:

1. Lowercase `tmux keybindings` title at the left.
2. A right-aligned blue `esc close` badge on the title row.
3. Muted subtitle: `available commands and configured shortcuts`.
4. Lowercase `global`, `tabs`, and `panes` headings in cyan.
5. Every existing shortcut in magenta, aligned to a stable left column, with
   its existing description in primary text.
6. A final muted footer that truthfully advertises
   `toggle Option+Command+T` and `close Esc` only.

The renderer must apply the background across each complete visible row,
including padding, and reset ANSI state at every row boundary. Compute visible
width, padding, and truncation from unstyled Unicode code points before adding
ANSI sequences. On insufficient height, reserve the footer and replace the last
available content row with a muted `... resize dialog to see all bindings`
message. Do not claim scrolling support.

## Object design constraints

- `BindingsPanelRenderer` remains the orchestration class. It owns dialog
  composition but delegates palette data and terminal-line mechanics so it does
  not become a god class.
- Add `DialogPalette` as an immutable class DTO with explicit colour properties,
  a private constructor, and one named static factory for the tmux palette. Do
  not use `Record` or dynamic keys.
- Add `StyledSegment` as an immutable class DTO/value object for text plus its
  explicit foreground, background, and emphasis values. One exported class,
  one file.
- Add `TerminalLine` as the focused value object responsible for code-point
  width, truncation, padding, ANSI rendering, background fill, and reset. It
  consumes concrete `StyledSegment` instances and contains no reflection.
- Add `TerminalOutput` under test support as an immutable class DTO/value object
  that strips ANSI and exposes rows/visible widths for assertions. Do not add
  free test helper functions.
- Use concrete classes directly. Do not create interfaces, ports, adapters,
  service locators, dependency containers, or inheritance hierarchies.
- Keep one exported class per file. No newly added line may use `typeof`,
  `instanceof`, `Record`, `Reflect`, `Object.keys`, `Object.values`, or
  `Object.entries`.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Install in fresh worktree | `vp install --frozen-lockfile` | exit 0 |
| Focused tests | `vp test plugins/tmux-keybindings/tests/presentation/bindings-panel-renderer.test.ts plugins/tmux-keybindings/tests/presentation/panel-close-shortcut.test.ts plugins/tmux-keybindings/tests/architecture/plugin-contract.test.ts` | all focused tests pass |
| Render smoke | `node --experimental-strip-types --input-type=module -e "import { BindingsPanelRenderer } from './plugins/tmux-keybindings/index.ts'; process.stdout.write(new BindingsPanelRenderer().render(84, 30))"` | styled 84x30 dialog output |
| Format | `make format-all` | exit 0, no formatter or lint errors |
| Full verification | `vp run ready` | check and complete test suite pass |
| Dependency audit | `pnpm audit --audit-level high` | no high or critical vulnerability |
| Diff hygiene | `git diff --check` | no output, exit 0 |

## Scope

**In scope**:

- `plugins/tmux-keybindings/herdr-plugin.toml`
- `plugins/tmux-keybindings/src/presentation/bindings-panel-renderer.ts`
- `plugins/tmux-keybindings/src/presentation/panel-close-shortcut.ts`
- `plugins/tmux-keybindings/src/presentation/terminal/dialog-palette.ts` (new)
- `plugins/tmux-keybindings/src/presentation/terminal/styled-segment.ts` (new)
- `plugins/tmux-keybindings/src/presentation/terminal/terminal-line.ts` (new)
- `plugins/tmux-keybindings/tests/architecture/plugin-contract.test.ts`
- `plugins/tmux-keybindings/tests/presentation/bindings-panel-renderer.test.ts`
- `plugins/tmux-keybindings/tests/presentation/panel-close-shortcut.test.ts`
- `plugins/tmux-keybindings/tests/support/terminal-output.ts` (new)

**Out of scope**:

- `PANEL_GROUPS`, keybinding assignments, action IDs, and descriptions
- `BindingsPanelApplication` lifecycle behavior
- New scrolling, mouse, Enter-to-close, or navigation interactions
- New runtime or development dependencies
- New interfaces, adapters, free helper functions, reflection, `typeof`,
  `instanceof`, or `Record` types
- Plugin versions, installation behavior, and other plugins
- Improve plan and index files

## Git workflow

- Assigned branch: `chore/ollin-tmux-help-dialog`
- Base: the Plan 001 branch after its PR reaches `PR READY`
- Create one logical commit with subject `Restyle tmux help dialog`.
- Do not push, open a PR, merge, or edit Improve artifacts.

## Steps

### Step 1: Lock the visual and input regressions in tests

Add the focused `TerminalOutput` immutable test DTO and extend the renderer test
without free helper functions. Assert that:

- the title, subtitle, badge, headings, every `PANEL_GROUPS` shortcut and every
  description appear at `84x30`;
- the required true-colour ANSI sequences are present;
- stripping ANSI produces exactly 30 rows, each no wider than 84 code points;
- the badge is right-aligned on the first stripped row;
- a short height preserves the footer and displays the resize message;
- every styled row ends with a reset sequence.

Extend the shortcut test to accept standalone Escape, standalone Ctrl+C, and
exact bytes `[0x1b, 0x74]`, while rejecting arrow sequences such as
`[0x1b, 0x5b, 0x41]` and unrelated Alt sequences such as `[0x1b, 0x78]`.

Update the architecture contract's expected popup height from 24 to 30.

**Verify**: the focused test command fails only on the new visual, height, and
input expectations before implementation.

### Step 2: Implement the single-column styled renderer

Keep the public `BindingsPanelRenderer` constructor and
`render(width, height): string` method unchanged. Split the new implementation
across the three concrete production classes named in Object design constraints.
Each class owns one concern and lives in its own file; no class may simply
forward another method or exist only to imitate a port/adapter convention.

Build rows from immutable `StyledSegment` DTOs, let `TerminalLine` truncate and
pad visible text, then apply the exact `DialogPalette`. Retain a minimum safe
width of 20 and a minimum safe height of 4. Use `PANEL_GROUPS` directly and
render it in its existing order. Remove the wide two-column branch and
decorative divider.

**Verify**: renderer tests pass, and the render-smoke command visibly matches
the specified hierarchy without leaking terminal style after the final row.

### Step 3: Make close detection sequence-specific

Replace the byte scan with exact accepted sequences:

- one byte `0x1b` for Escape;
- one byte `0x03` for Ctrl+C;
- two bytes `[0x1b, 0x74]` for the existing legacy Alt-T representation.

All other input returns `false`. Do not add timers, stateful sequence buffering,
or new close shortcuts.

**Verify**: the focused shortcut tests pass, including arrow and unrelated Alt
regressions.

### Step 4: Increase the popup height

Change only the tmux `bindings` pane height in `herdr-plugin.toml` from 24 to
30 and update its contract assertion. Preserve width, placement, title,
version, command, and all other manifest fields.

**Verify**: the focused architecture contract passes.

### Step 5: Format and prove repository compatibility

Run all required gates and inspect the full branch diff against its assigned
base. Confirm that ANSI codes do not participate in visible-width calculations
and every command remains sourced from `PANEL_GROUPS`.

**Verify**:

- `make format-all` exits 0.
- `vp run ready` exits 0.
- `pnpm audit --audit-level high` reports no high or critical vulnerability.
- `git diff --check` exits 0 with no output.
- `git diff --name-only <assigned-base>...HEAD` lists only the six in-scope
  existing files and four declared new files.
- `git diff -U0 <assigned-base>...HEAD | rg '^\+.*\b(typeof|instanceof|Record|interface)\b|^\+.*\bReflect\.|^\+.*\bObject\.(keys|values|entries)\b'`
  returns no matches.
- Every new production or test-support file contains exactly one exported
  class and no exported free function.

## Test plan

- Prefer exact behavior assertions over a large snapshot.
- Strip ANSI only for geometry and textual assertions; separately assert the
  required colour sequences through `TerminalOutput` methods so styling remains
  covered.
- Derive catalogue assertions from `PANEL_GROUPS` to prevent future commands
  from disappearing silently.
- Cover the accepted byte sequences and the two named regressions.
- Keep existing narrow and short viewport intent, updated for the new layout.

## Done criteria

- [ ] The `84x30` output matches the specified visual hierarchy and palette.
- [ ] Every existing tmux shortcut and description appears without overflow.
- [ ] Every stripped row is at most 84 code points and ANSI state resets safely.
- [ ] Short viewports show a truthful resize message and close footer.
- [ ] Escape, Ctrl+C, and exact `Esc+t` close the dialog.
- [ ] Arrow keys and unrelated Alt sequences do not close the dialog.
- [ ] Popup height is 30; all other manifest behavior is unchanged.
- [ ] New rendering data uses immutable class DTOs/value objects, one exported
  class per file.
- [ ] No new interface, adapter, free helper function, `typeof`, `instanceof`,
  reflection, or `Record` usage is introduced.
- [ ] Focused tests, render smoke, and `vp run ready` pass.
- [ ] `pnpm audit --audit-level high` and `git diff --check` pass.
- [ ] Only the ten in-scope files are changed.
- [ ] The executor creates the required local commit.

## STOP conditions

Stop and report if:

- The live renderer, shortcut detector, manifest, or tests materially differ
  from the current-state description.
- The target layout cannot show the full existing catalogue at `84x30` without
  changing commands or descriptions.
- Correct visible-width handling requires adding a dependency.
- The design requires reflection, `typeof`, `instanceof`, `Record`, a new
  interface/adapter, or more than one exported class in a file.
- The work requires changing `BindingsPanelApplication` or any out-of-scope
  file.
- The TypeScript coding standards conflict irreconcilably with repository
  conventions or this confirmed scope.
- A verification failure remains after two bounded correction attempts.

## Maintenance notes

- Future command additions must remain driven by `PANEL_GROUPS`; the renderer
  tests should fail if the 84x30 contract no longer fits.
- Reviewers should inspect the raw ANSI output for full-row background fill,
  right-aligned badge spacing, per-row resets, and truthful footer text.
- Keep close detection strict. Broad Escape-byte matching recreates the arrow
  key regression.
