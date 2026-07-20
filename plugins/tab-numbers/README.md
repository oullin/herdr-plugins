# Tab Numbers

Show each named tab as `name · <stable Herdr number>`.

Herdr numbers remain stable when tabs close, so gaps are preserved. For example:

```text
skills · 1
gocanto.sh · 5
oullin-web · 7
```

Numeric auto-generated labels are left untouched. A trailing ` · <digits>` is reserved for this plugin; stale or duplicate suffixes are normalized to the tab's current Herdr number. Manual renames receive the suffix again automatically.

## Install

```sh
herdr plugin install oullin/herdr-plugins/plugins/tab-numbers
```

Synchronize tabs that already exist:

```sh
herdr plugin action invoke oullin.tab-numbers.sync
```

The `tab.created` and `tab.renamed` hooks keep new and renamed tabs synchronized. The plugin is strict, class-based TypeScript executed natively by Node.js 24, remains dependency-free, and calls Herdr through the injected `HERDR_BIN_PATH`.

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
