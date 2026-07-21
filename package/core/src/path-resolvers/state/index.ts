import { join } from 'node:path';

import { PluginError } from '#herdr-plugin-core/errors';
import type { Environment } from '#herdr-plugin-core/models';

export class PluginStateDirectoryResolver {
	private readonly pluginId: string;

	constructor(pluginId: string) {
		this.pluginId = pluginId;
	}

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

			return join(localAppData, 'herdr', 'plugins', this.pluginId, 'state');
		}

		const stateHome = environment['XDG_STATE_HOME'];

		if (stateHome) {
			return join(stateHome, 'herdr', 'plugins', this.pluginId);
		}

		const home = environment['HOME'];

		if (!home) {
			throw new PluginError('Could not resolve plugin state: HOME is not set');
		}

		return join(home, '.local', 'state', 'herdr', 'plugins', this.pluginId);
	}
}
