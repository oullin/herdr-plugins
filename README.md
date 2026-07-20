# Herdr plugins

Focused, independently installable plugins for [Herdr](https://herdr.dev/).

## Plugin catalog

| Plugin                             | Description                                             | Install                                                         |
| ---------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| [Tab Numbers](plugins/tab-numbers) | Adds each named tab's contiguous position to its label. | `herdr plugin install oullin/herdr-plugins/plugins/tab-numbers` |

Herdr installs plugins from repository subdirectories, so this repository has one marketplace listing while each plugin remains independently installable.

## Development

Requirements:

- Node.js 24
- pnpm 11.15.1 (pinned through `packageManager`)
- [Vite+](https://viteplus.dev/)
- [Fmtkit](https://github.com/oullin/fmtkit)

Install Fmtkit with Homebrew:

```sh
brew tap oullin/fmtkit
brew install --cask fmtkit
```

Install and validate the complete workspace:

```sh
make format-all
vp install --frozen-lockfile
vp run ready
```

`make format-all` formats and lints every TypeScript file. `vp run ready` runs `vp check` followed by the complete test suite. See [the plugin conventions](docs/plugin-conventions.md) before adding a package.

## License

[MIT](LICENSE)
