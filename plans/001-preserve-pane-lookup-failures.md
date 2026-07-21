# Plan 001: Preserve real pane lookup failures

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> STOP condition occurs, stop and report; do not improvise. Commit the work in
> the assigned Ollin worktree. Skip every instruction to update
> `plans/README.md`; the parent reviewer owns Improve artifacts.
>
> **Drift check (run first)**:
> `git diff --stat 41f59cd..HEAD -- packages/plugin-core/src/herdr-cli/panes/index.ts packages/plugin-core/tests/herdr-cli-client.test.ts`
> If either file changed, compare the excerpts below with the live code. Stop
> on a material mismatch.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `41f59cd`, 2026-07-21
- **Ollin delivery**: DONE
- **Worktree**: `/Users/gocanto/.codex/worktrees/codex/herdr-plugin-plan-001-pane-lookup-errors`
- **Branch**: `chore/ollin-pane-lookup-errors`
- **Routing profile**: `gpt-5.6-sol@high=100%`
- **Effective routing**: `gpt-5.6-sol@high=100%`
- **Model**: `gpt-5.6-sol`
- **Level**: `high`
- **Harness**: authenticated Codex CLI (`codex`)
- **Approved commit**: `9eb32035267c834e1d257746907f343cabdf6743`
- **Review correction commit**: `5a1cf20c0c1a51fc857586acef9b181cedb74723`
- **Draft PR**: `https://github.com/oullin/herdr-plugins/pull/6`
- **PR head**: `5a1cf20c0c1a51fc857586acef9b181cedb74723`
- **PR state**: merged as pull request #6 into the delivery branch; accepted
  commits reached `main` through pull request #5
- **Target branch**: `main` at
  `b3c7373b70491373a3430686c074f28a1bb77674`
- **Automated review note**: Gemini reviewed the original head and its only
  finding was corrected on the current head; the integration's own notice says
  the consumer review service ended on 2026-07-17, so no current-head rerun is
  available or treated as a remaining gate
- **Parent review**: APPROVE; focused tests 8/8, full suite 92/92,
  formatting, linting, typechecking, audit, diff hygiene, scope, and forbidden
  additions checks passed

## Why this matters

`HerdrPaneClient.getPane()` currently maps every failed process invocation and
every non-zero Herdr response to `undefined`. Callers therefore cannot
distinguish a genuinely missing pane from a disconnected Herdr server, a
permission problem, or another API failure. Preserve the useful optional
lookup contract for `pane_not_found`, but let operational and decoding failures
remain observable.

## Current state

- `packages/plugin-core/src/herdr-cli/panes/index.ts:24-32` bypasses the normal
  transport error decoder:

  ```ts
  getPane(paneId: string): Pane | undefined {
      const args = ['pane', 'get', paneId];
      const result = this.transport.execute(args);

      if (result.error || result.status !== 0) {
          return undefined;
      }

      return this.parse(this.transport.decodeResult(result.stdout, args)['pane']);
  }
  ```

- `HerdrCliTransport.call()` already converts structured error responses into
  `HerdrCommandError` and preserves their `code` field. Use that existing seam;
  do not duplicate response decoding.
- `packages/plugin-core/tests/herdr-cli-client.test.ts` uses
  `StubCommandRunner` and direct argument assertions. Add tests there using the
  same style and real structured Herdr response envelopes.
- The installed Herdr 0.7.4 CLI reports a missing pane with error code
  `pane_not_found`.
- The transport boundary is known to throw `HerdrCommandError`. Inside the
  narrow `getPane()` catch, use a local type assertion to that existing class
  and inspect its `code`; do not add `instanceof`, `typeof`, reflection, a new
  interface, an adapter, or a new DTO for a value that is not transported.

## Commands you will need

| Purpose                   | Command                                                       | Expected on success                 |
| ------------------------- | ------------------------------------------------------------- | ----------------------------------- |
| Install in fresh worktree | `vp install --frozen-lockfile`                                | exit 0                              |
| Focused tests             | `vp test packages/plugin-core/tests/herdr-cli-client.test.ts` | all focused tests pass              |
| Format                    | `make format-all`                                             | exit 0, no formatter or lint errors |
| Full verification         | `vp run ready`                                                | check and complete test suite pass  |
| Dependency audit          | `pnpm audit --audit-level high`                               | no high or critical vulnerability   |
| Diff hygiene              | `git diff --check`                                            | no output, exit 0                   |

## Scope

**In scope**:

- `packages/plugin-core/src/herdr-cli/panes/index.ts`
- `packages/plugin-core/tests/herdr-cli-client.test.ts`

**Out of scope**:

- Public method signatures or package exports
- `closePluginPane()` and its boolean result
- Other Herdr clients or a repository-wide error-model rewrite
- New interfaces, adapters, DTOs, reflection, `typeof`, `instanceof`, or
  `Record` types
- Improve plan and index files

## Git workflow

- Assigned branch: `chore/ollin-pane-lookup-errors`
- Base: `chore/pane-navigation-hints`
- Create one logical commit with subject `Preserve pane lookup failures`.
- Do not push, open a PR, merge, or edit Improve artifacts.

## Steps

### Step 1: Characterise the lookup contract

Extend `packages/plugin-core/tests/herdr-cli-client.test.ts` with direct tests
that prove:

1. A successful `pane get` response returns the parsed pane.
2. A structured `pane_not_found` error returns `undefined`.
3. A different structured Herdr error is rethrown with its code intact.
4. A command-runner process error is rethrown rather than hidden.

Use `StubCommandRunner`; do not mock modules or call a live Herdr server.

**Verify**:
`vp test packages/plugin-core/tests/herdr-cli-client.test.ts` must fail only on
the newly asserted error-semantics cases before implementation.

### Step 2: Route lookup through the normal decoder

Change `HerdrPaneClient.getPane()` to call the transport's decoded JSON path.
The transport contract already normalises failures to `HerdrCommandError`, so
inside the narrow catch use a local assertion to that existing class and
translate only `code === 'pane_not_found'` into `undefined`; rethrow the
original caught value for every other code. Pass the returned `pane` value
through the existing private `parse()` method so malformed success payloads
still fail loudly.

Do not add a new error class, DTO, interface, adapter, `typeof`, `instanceof`,
reflection, `Record`, change `PaneClient`, or weaken parsing.

**Verify**:
`vp test packages/plugin-core/tests/herdr-cli-client.test.ts` passes all focused
tests.

### Step 3: Format and prove repository compatibility

Run the formatter and all repository gates. Review the branch diff and ensure
only the two in-scope files changed.

**Verify**:

- `make format-all` exits 0.
- `vp run ready` exits 0.
- `pnpm audit --audit-level high` reports no high or critical vulnerability.
- `git diff --check` exits 0 with no output.
- `git diff --name-only chore/pane-navigation-hints...HEAD` lists only the two
  in-scope files.
- `git diff -U0 chore/pane-navigation-hints...HEAD | rg '^\+.*\b(typeof|instanceof|Record|interface)\b|^\+.*\bReflect\.|^\+.*\bObject\.(keys|values|entries)\b'`
  returns no matches.

## Test plan

- Keep the existing shared-client tests intact.
- Add one happy-path pane lookup and the three failure-path cases named above.
- Assert both behavior and the command arguments sent to Herdr where useful.
- Do not test private methods or duplicate transport decoder tests.

## Done criteria

- [x] `getPane()` returns `undefined` only for `pane_not_found`.
- [x] Other structured Herdr errors retain their code and are thrown.
- [x] Process errors and malformed success payloads are observable failures.
- [x] The public `Pane | undefined` signature and exports are unchanged.
- [x] No new interface, adapter, DTO, `typeof`, `instanceof`, reflection, or
      `Record` usage is introduced.
- [x] Focused tests and `vp run ready` pass.
- [x] `pnpm audit --audit-level high` and `git diff --check` pass.
- [x] Only the two in-scope files are changed.
- [x] The executor creates the required local commit.

## STOP conditions

Stop and report if:

- The live method no longer matches the current-state excerpt.
- Herdr's structured missing-pane code is not `pane_not_found`.
- Correct behavior requires changing the public `PaneClient` interface.
- Correct behavior cannot be expressed through the existing concrete
  `HerdrCommandError` contract without new reflection or an unsafe broad cast.
- A required fix touches any out-of-scope file.
- A verification failure remains after two bounded correction attempts.

## Maintenance notes

- Reviewers should confirm that the catch is code-specific and does not reduce
  all `HerdrCommandError` instances to absence.
- Future optional lookup methods should follow the same pattern: translate only
  the explicit not-found code and preserve operational failures.
