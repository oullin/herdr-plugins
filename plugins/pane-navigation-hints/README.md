# Pane Navigation Hints

Show the effective pane navigation shortcuts in every Herdr pane border. The plugin reads the active `config.toml`, keeps the legend below Herdr's 80-character pane-title limit, and updates newly created panes automatically.

For the tmux-style profile, the border resembles:

```text
Ctrl+B then ←/↓/↑/→ · Last ;
```

Read the shared prefix first: press `Ctrl+B`, release it, then press the arrow pointing toward the adjacent pane you want to focus. `Last ;` uses the same prefix to return to the last pane.

The plugin is display-only. It does not change keybindings and does not depend on the Tmux Keybindings plugin.

## Install and refresh

```sh
herdr plugin install oullin/herdr-plugins/plugins/pane-navigation-hints
herdr plugin action invoke oullin.pane-navigation-hints.refresh
```

The refresh action validates the current Herdr configuration, reads pane navigation values from `[keys]`, and applies the legend to all existing panes. Missing values use the Herdr 0.7.4 defaults, while empty strings remain unbound and are omitted from the legend.

A `pane.created` hook applies the same legend to future panes. Invoke refresh again after changing and reloading `config.toml`.

The config path follows `HERDR_CONFIG_PATH` when it is set. Otherwise the plugin reads `%APPDATA%\herdr\config.toml` on Windows and `~/.config/herdr/config.toml` (or `$XDG_CONFIG_HOME/herdr/config.toml`) on Linux and macOS.

## Clear and uninstall

Clear the plugin-owned title metadata to reveal the normal pane titles:

```sh
herdr plugin action invoke oullin.pane-navigation-hints.clear
```

Clear active hints before disabling or uninstalling the plugin:

```sh
herdr plugin action invoke oullin.pane-navigation-hints.clear
herdr plugin uninstall oullin.pane-navigation-hints
```

The clear action removes only metadata reported by this plugin. Manual pane names and titles from other sources remain untouched.

## Development

From the repository root:

```sh
vp install --frozen-lockfile
vp run ready
herdr plugin link plugins/pane-navigation-hints
herdr plugin action invoke oullin.pane-navigation-hints.refresh
herdr plugin log list --plugin oullin.pane-navigation-hints
```

The plugin is strict TypeScript executed natively by Node.js 24 and uses the repository-local `@oullin/herdr-plugin-core` package from the same Herdr-managed checkout.

## Licence

[MIT](LICENSE)
