import { join } from 'node:path';

import { PLUGIN_ID } from '#tmux-keybindings/domain/keybinding-profile';
import type { Environment } from '#tmux-keybindings/domain/models';
import { PluginError } from '#tmux-keybindings/errors/plugin-error';

export class StateDirectoryResolver {
	resolve(environment: Environment = process.env, platform: NodeJS.Platform = process.platform): string {
		const injected = environment['HERDR_PLUGIN_STATE_DIR'];

		if (injected) {
			return injected;
		}

		if (platform === 'win32') {
			const localAppData = environment['LOCALAPPDATA'] ?? environment['APPDATA'];

			if (!localAppData) {
				throw new PluginError('Could not resolve plugin state: LOCALAPPDATA and APPDATA are not set');
			}

			return join(localAppData, 'herdr', 'plugins', PLUGIN_ID, 'state');
		}

		const stateHome = environment['XDG_STATE_HOME'];

		if (stateHome) {
			return join(stateHome, 'herdr', 'plugins', PLUGIN_ID);
		}

		const home = environment['HOME'];

		if (!home) {
			throw new PluginError('Could not resolve plugin state: HOME is not set');
		}

		return join(home, '.local', 'state', 'herdr', 'plugins', PLUGIN_ID);
	}
}
