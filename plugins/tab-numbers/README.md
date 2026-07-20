# Tab Numbers

Show each named tab as `name · <position>` with contiguous numbers in the order Herdr displays the tabs.

Sparse internal Herdr numbers are re-indexed, so gaps disappear. For example, tabs with internal numbers `1`, `5`, and `7` display as:

```text
skills · 1
gocanto.sh · 2
oullin-web · 3
```

Numeric auto-generated labels are left untouched. A trailing ` · <digits>` is reserved for this plugin; stale or duplicate suffixes are normalized to the tab's current position. Manual renames receive the suffix again automatically.

## Install

```sh
herdr plugin install oullin/herdr-plugins/plugins/tab-numbers
```

Synchronize tabs that already exist:

```sh
herdr plugin action invoke oullin.tab-numbers.sync
```

The `tab.created`, `tab.renamed`, `tab.closed`, and `tab.moved` hooks keep the sequence contiguous as tabs change. The plugin is strict, class-based TypeScript executed natively by Node.js 24, remains dependency-free, and calls Herdr through the injected `HERDR_BIN_PATH`.

The runtime follows explicit SOLID-oriented boundaries: domain formatting, application orchestration and ports, Herdr CLI infrastructure, process presentation, and a small `index.ts` composition root. Native `#tab-numbers/<concern>/*` ESM aliases enforce those boundaries without relative imports. Tests mirror the production concerns under `tests/` and share only focused test doubles.

## Development

From the repository root:

```sh
vp install --frozen-lockfile
vp run ready
herdr plugin link plugins/tab-numbers
herdr plugin action invoke oullin.tab-numbers.sync
herdr plugin log list --plugin oullin.tab-numbers
```

## License

[MIT](LICENSE)
