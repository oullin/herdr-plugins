# Tab Numbers

Show each named tab as `name · <position>` with contiguous numbers in the order Herdr displays the tabs.

## Install

Tab Numbers requires Herdr 0.7.0 or newer and Node.js 24.12 or newer within the Node.js 24 release line.

Install the plugin, then synchronise tabs that already exist:

```sh
herdr plugin install oullin/herdr-plugins/plugins/tab-numbers
herdr plugin action invoke oullin.tab-numbers.sync
```

![Herdr tabs labelled Dashboard 1, Editor 2, and Tests 3](../../docs/images/tab-numbers.png)

## Actions

| Action | Command                                              | Effect                                                    |
| ------ | ---------------------------------------------------- | --------------------------------------------------------- |
| Sync   | `herdr plugin action invoke oullin.tab-numbers.sync` | Re-index every named tab using its current display order. |

The `tab.created`, `tab.renamed`, `tab.closed`, and `tab.moved` hooks keep the sequence contiguous after the initial synchronisation.

## Behaviour

Sparse internal Herdr numbers are re-indexed, so gaps disappear. For example, tabs with internal numbers `1`, `5`, and `7` display as:

```text
skills · 1
gocanto.sh · 2
oullin-web · 3
```

Numeric auto-generated labels are left untouched. A trailing ` · <digits>` is reserved for this plugin; stale or duplicate suffixes are normalised to the tab's current position. Manual renames receive the suffix again automatically.

Installation links the repository-local `@oullin/herdr-plugin-core` package from the same Herdr-managed checkout. The strict, class-based TypeScript executes natively with Node.js 24 and calls Herdr through the injected `HERDR_BIN_PATH`.

## Uninstall

```sh
herdr plugin uninstall oullin.tab-numbers
```

Uninstalling stops future synchronisation. It does not rename existing tabs, so remove suffixes manually if you no longer want them.

## Development

From the repository root:

```sh
vp install --frozen-lockfile
vp run ready
herdr plugin link plugins/tab-numbers
herdr plugin action invoke oullin.tab-numbers.sync
herdr plugin log list --plugin oullin.tab-numbers
```

The runtime follows explicit SOLID-oriented boundaries: domain formatting, application orchestration and ports, shared Herdr infrastructure, process presentation, and a small `index.ts` composition root. Native `#tab-numbers/<concern>/*` ESM aliases enforce those boundaries without relative imports. Tests mirror the production concerns under `tests/` and use the core package's focused test doubles.

## Licence

[MIT](LICENSE)
