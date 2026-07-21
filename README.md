# Herdr plugins

Focused, independently installable plugins for [Herdr](https://herdr.dev/).

## Plugin catalogue

| Plugin                                                 | Description                                                | Install                                                                   |
| ------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| [Tab Numbers](plugins/tab-numbers)                     | Adds each named tab's contiguous position to its label.    | `herdr plugin install oullin/herdr-plugins/plugins/tab-numbers`           |
| [Tmux Keybindings](plugins/tmux-keybindings)           | Applies tmux-style bindings with a modal reference dialog. | `herdr plugin install oullin/herdr-plugins/plugins/tmux-keybindings`      |
| [Pane Navigation Hints](plugins/pane-navigation-hints) | Shows live pane navigation shortcuts in every pane border. | `herdr plugin install oullin/herdr-plugins/plugins/pane-navigation-hints` |

Herdr installs plugins from repository subdirectories, so this repository has one marketplace listing while each plugin remains independently installable.

## Plugin SDK

[`@oullin/herdr-plugin-core`](package/core) is the private, repository-local runtime SDK shared by these plugins. Each plugin declares it through a `file:` dependency, and Herdr installs that dependency from the same managed repository checkout.

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

## Licence

[MIT](LICENSE)
